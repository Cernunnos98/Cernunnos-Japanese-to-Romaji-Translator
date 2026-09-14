#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const rootArg = args.find(arg => arg !== '--check');
const root = path.resolve(rootArg || path.join(__dirname, '..'));
const markdownPath = path.join(root, 'readme', 'cj2r-architectural-control-flow.md');
const svgPath = path.join(root, 'readme', 'cj2r-architectural-control-flow.svg');

function extractMermaid(markdown) {
    const match = markdown.match(/```mermaid\s*\n([\s\S]*?)\n```/u);
    if (!match) throw new Error('The architectural flow Markdown has no Mermaid block.');
    return match[1].replace(/\r\n/g, '\n').trimEnd() + '\n';
}

function unescapeLabel(value) {
    return String(value || '')
        .replace(/\\n/g, '\n')
        .replace(/<br\s*\/?>/giu, '\n')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function dotQuote(value) {
    return `"${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function parseEndpoint(raw) {
    const text = String(raw || '').trim();
    const idMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*)/u);
    if (!idMatch) return null;
    const id = idMatch[1];
    const rest = text.slice(id.length).trim();
    if (!rest) return { id, label: id, shape: 'box' };
    let label = id;
    let shape = 'box';
    const wrappers = [
        [/^\(\[([\s\S]*)\]\)$/u, 'oval'],
        [/^\[\[([\s\S]*)\]\]$/u, 'component'],
        [/^\{([\s\S]*)\}$/u, 'diamond'],
        [/^\[([\s\S]*)\]$/u, 'box'],
        [/^\(([\s\S]*)\)$/u, 'ellipse']
    ];
    for (const [pattern, candidateShape] of wrappers) {
        const match = rest.match(pattern);
        if (match) { label = unescapeLabel(match[1]); shape = candidateShape; break; }
    }
    return { id, label, shape };
}

function parseFlow(mermaid) {
    const nodes = new Map();
    const edges = [];
    const ensureNode = endpoint => {
        if (!endpoint) return;
        const existing = nodes.get(endpoint.id);
        if (!existing || (existing.label === existing.id && endpoint.label !== endpoint.id)) nodes.set(endpoint.id, endpoint);
    };
    for (const rawLine of mermaid.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('%%') || /^flowchart\b/u.test(line) || /^classDef\b/u.test(line)) continue;
        let leftText = null, rightText = null, label = '', dotted = false;
        let match = line.match(/^(.+?)\s+-->\|([^|]*)\|\s+(.+)$/u);
        if (match) { [, leftText, label, rightText] = match; }
        else {
            match = line.match(/^(.+?)\s+-->\s+(.+)$/u);
            if (match) [, leftText, rightText] = match;
            else {
                match = line.match(/^(.+?)\s+-\.\s*([^.]*)\s*\.->\s+(.+)$/u);
                if (match) { [, leftText, label, rightText] = match; dotted = true; }
            }
        }
        if (leftText && rightText) {
            const left = parseEndpoint(leftText);
            const right = parseEndpoint(rightText);
            if (!left || !right) throw new Error(`Unsupported flow edge: ${line}`);
            ensureNode(left); ensureNode(right);
            edges.push({ from: left.id, to: right.id, label: unescapeLabel(label), dotted });
            continue;
        }
        const node = parseEndpoint(line);
        if (node && line !== node.id) ensureNode(node);
    }
    return { nodes: [...nodes.values()], edges };
}

function toDot(flow) {
    const out = [
        'digraph CJ2R {',
        '  graph [rankdir=TB, bgcolor="transparent", pad="0.2", nodesep="0.25", ranksep="0.35", splines=ortho];',
        '  node [fontname="Arial", fontsize=10, color="#4b5563", fontcolor="#111827", style="rounded,filled", fillcolor="#f9fafb", margin="0.08,0.05"];',
        '  edge [fontname="Arial", fontsize=8, color="#6b7280", fontcolor="#374151", arrowsize=0.7];'
    ];
    const shapeMap = { oval: 'oval', component: 'component', diamond: 'diamond', box: 'box', ellipse: 'ellipse' };
    for (const node of flow.nodes) out.push(`  ${node.id} [shape=${shapeMap[node.shape] || 'box'}, label=${dotQuote(node.label)}];`);
    for (const edge of flow.edges) {
        const attrs = [];
        if (edge.label) attrs.push(`label=${dotQuote(edge.label)}`);
        if (edge.dotted) attrs.push('style=dashed');
        out.push(`  ${edge.from} -> ${edge.to}${attrs.length ? ` [${attrs.join(', ')}]` : ''};`);
    }
    out.push('}');
    return out.join('\n') + '\n';
}

function mermaidHash(mermaid) {
    return crypto.createHash('sha256').update(mermaid).digest('hex');
}

function decodeXmlText(value) {
    return String(value || '')
        .replace(/<[^>]+>/gu, '')
        .replace(/&#x([0-9a-f]+);/giu, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#([0-9]+);/gu, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
        .replace(/&quot;/gu, '"')
        .replace(/&apos;/gu, "'")
        .replace(/&lt;/gu, '<')
        .replace(/&gt;/gu, '>')
        .replace(/&amp;/gu, '&')
        .trim();
}

function semanticSvgProjection(svg) {
    if (!/<svg\b[^>]*>/u.test(svg) || !/<\/svg>/u.test(svg)) return null;
    const records = [];
    const groupPattern = /<g\b[^>]*\bclass="(node|edge)"[^>]*>([\s\S]*?)<\/g>/gu;
    for (const match of svg.matchAll(groupPattern)) {
        const kind = match[1];
        const body = match[2];
        const titleMatch = body.match(/<title>([\s\S]*?)<\/title>/u);
        if (!titleMatch) return null;
        const geometry = [...body.matchAll(/<(ellipse|path|polygon|rect)\b/gu)]
            .map(geometryMatch => geometryMatch[1])
            .sort();
        if (!geometry.length) return null;
        const labels = [...body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gu)]
            .map(textMatch => decodeXmlText(textMatch[1]));
        records.push({
            kind,
            title: decodeXmlText(titleMatch[1]),
            labels,
            geometry,
            dashed: kind === 'edge' && /stroke-dasharray=/u.test(body)
        });
    }
    if (!records.length) return null;
    return records
        .map(record => JSON.stringify(record))
        .sort();
}

function projectionsEqual(left, right) {
    return Boolean(left && right)
        && left.length === right.length
        && left.every((value, index) => value === right[index]);
}

function renderSvg(mermaid) {
    const flow = parseFlow(mermaid);
    if (!flow.nodes.length || !flow.edges.length) throw new Error('The Mermaid flow could not be parsed into a graph.');
    const dot = toDot(flow);
    const result = spawnSync('dot', ['-Tsvg'], { input: dot, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || `dot exited ${result.status}`);
    const hash = mermaidHash(mermaid);
    return result.stdout.replace(/<!-- Generated by graphviz[^>]*-->/u, `<!-- Generated from readme/cj2r-architectural-control-flow.md Mermaid SHA-256 ${hash}. Do not edit this SVG directly. -->`);
}

const mermaid = extractMermaid(fs.readFileSync(markdownPath, 'utf8'));
if (checkOnly) {
    // Graphviz layout coordinates can drift between versions and platforms, so parity is
    // based on source freshness plus graph semantics rather than byte-identical SVG geometry.
    const generated = renderSvg(mermaid);
    const expectedHash = mermaidHash(mermaid);
    const current = fs.existsSync(svgPath) ? fs.readFileSync(svgPath, 'utf8') : '';
    const hashMatch = current.match(/Mermaid SHA-256 ([0-9a-f]{64})/u);
    const semanticMatch = projectionsEqual(
        semanticSvgProjection(current),
        semanticSvgProjection(generated)
    );
    if (!hashMatch || hashMatch[1] !== expectedHash || !semanticMatch) {
        console.error('cj2r-architectural-control-flow.svg is out of date with the Markdown Mermaid source or differs semantically.');
        console.error('Layout-only Graphviz coordinate differences are ignored.');
        console.error('Run: node tools/build-cj2r-flowchart.js');
        process.exit(1);
    }
    console.log('Generated architectural flow SVG is up to date (layout coordinates ignored).');
    process.exit(0);
}
const generated = renderSvg(mermaid);
fs.writeFileSync(svgPath, generated, 'utf8');
console.log(`Built ${path.relative(root, svgPath)} from the authoritative Mermaid flow.`);
