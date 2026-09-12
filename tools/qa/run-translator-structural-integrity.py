#!/usr/bin/env python3
import gzip
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from html.parser import HTMLParser
from pathlib import Path

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
errors = []
counts = {}

json_files = sorted(root.rglob('*.json'))
for path in json_files:
    try: json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc: errors.append(f'JSON {path.relative_to(root)}: {exc}')
counts['json'] = len(json_files)

gzip_files = sorted(root.rglob('*.gz'))
for path in gzip_files:
    try: gzip.decompress(path.read_bytes())
    except Exception as exc: errors.append(f'GZIP {path.relative_to(root)}: {exc}')
counts['gzip'] = len(gzip_files)

js_files = sorted(root.rglob('*.js'))
for path in js_files:
    result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if result.returncode: errors.append(f'JS {path.relative_to(root)}: {result.stderr.strip()}')
counts['javascript'] = len(js_files)

HTML_VOID_ELEMENTS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.balance_errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in HTML_VOID_ELEMENTS:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        return

    def handle_endtag(self, tag):
        if tag in HTML_VOID_ELEMENTS:
            return
        if not self.stack:
            self.balance_errors.append(f'unexpected closing </{tag}>')
            return
        if self.stack[-1] != tag:
            self.balance_errors.append(f'closing </{tag}> encountered while <{self.stack[-1]}> is open')
            if tag in self.stack:
                while self.stack and self.stack[-1] != tag:
                    self.stack.pop()
            else:
                return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

html_files = sorted(root.rglob('*.html'))
for path in html_files:
    try:
        parser = Parser(); parser.feed(path.read_text(encoding='utf-8')); parser.close()
        if parser.balance_errors:
            errors.append(f"HTML {path.relative_to(root)}: {'; '.join(parser.balance_errors)}")
        if parser.stack:
            errors.append(f"HTML {path.relative_to(root)}: unclosed tags: {', '.join(parser.stack)}")
    except Exception as exc: errors.append(f'HTML {path.relative_to(root)}: {exc}')
counts['html'] = len(html_files)

docx = root / 'readme' / 'Romaji Rules.docx'
try:
    with zipfile.ZipFile(docx) as archive:
        bad = archive.testzip()
        if bad: errors.append(f'DOCX corrupt member: {bad}')
except Exception as exc: errors.append(f'DOCX: {exc}')


source_files = [
    '00-contracts.js',
    '01-assets-and-schemas.js',
    '02-ui-controls.js',
    '03-runtime-state.js',
    '04-data-and-kanji-loaders.js',
    '05-romaji-core.js',
    '06-lexical-and-evidence-loaders.js',
    '07-token-merging.js',
    '08-reading-resolver.js',
    '09-token-repair-and-grammar.js',
    '10-output-and-translation-pipeline.js',
    '11-public-api-and-bootstrap.js',
]
for name in source_files:
    if not (root / 'src' / 'translator' / name).exists(): errors.append(f'Missing translator source section: {name}')
for rel in [
    'src/translator/translator-source-development-guide.md',
    'tools/build-translator-engine.js',
    'translator-engine.js.map',
    'tools/build-cj2r-flowchart.js',
    'tools/qa/build-translator-qa.js',
    'tools/qa/translator-qa.js.map',
    'tools/qa/run-translator-typecheck.js',
    'tools/qa/run-translator-dependency-check.js',
    'tools/qa/run-translator-punctuation-boundary-qa.js',
    'tools/qa/run-translator-punctuation-boundary-partitioned.js',
    'tools/qa/run-translator-failure-injection-partitioned.js',
    'tools/qa/run-translator-focused-qa.js',
    'tools/qa/run-translator-qa-dashboard.js',
    'tools/qa/Open CJ2R QA Dashboard.cmd',
    'tools/qa/dashboard/index.html',
    'tools/qa/dashboard/app.js',
    'tools/qa/dashboard/styles.css',
    'tools/qa/dashboard/server.js',
    'tools/qa/types/cj2r-globals.d.ts',
    'tools/qa/browser/fake-dom.js',
    'tools/qa/suites/qa-core.js',
    'tools/qa/suites/romaji-core.js',
    'tools/qa/suites/tokenisation-and-merging.js',
    'tools/qa/suites/tokenisation-mutation.js',
    'tools/qa/suites/numbers-and-counters.js',
    'tools/qa/suites/names-and-loanwords.js',
    'tools/qa/suites/grammar.js',
    'tools/qa/suites/ambiguity-and-audit.js',
    'tools/qa/suites/historical-kana.js',
    'tools/qa/suites/runtime-and-api.js',
    'tools/qa/suites/regression-mechanisms.js',
    'tools/qa/suites/qa-check-order.js',
    'tools/qa/suites/qa-runner.js',
    'tools/qa/translator-release-qa-guide.md',
    'tools/qa/translator-qa-troubleshooting.md',
    'tools/qa/test-translator-release-browser-isolation.js',
    'tools/qa/test-translator-semantic-data-safety.js',
    'tools/qa/browser/cdp-harness.js',
    'tools/qa/update-external-evidence-source-provenance-hashes.js',
    'tools/qa/test-update-external-evidence-source-provenance-hashes.js',
    'tools/evidence-candidate-generation/generate-yomitan-evidence-review-candidates.js',
    'tools/evidence-candidate-generation/test-generate-yomitan-evidence-review-candidates.js',
    'tools/evidence-candidate-generation/yomitan-evidence-candidate-generation-guide.md',
    'tools/edrdg-update/cj2r-edrdg-updater.js',
    'tools/edrdg-update/test-cj2r-edrdg-updater.js',
    'tools/edrdg-update/cj2r-edrdg-updater-sources.json',
    'tools/edrdg-update/cj2r-edrdg-updater-guide.md',
    'readme/introductory-guide.md',
    'readme/translator-guide.md',
    'readme/translator-integration-guide.md',
    'readme/translator-required-files-summary.md',
    'readme/translator-file-naming-audit.md',
    'readme/translator-data-provenance-classification-audit.md',
]:
    if not (root / rel).exists(): errors.append(f'Missing developer file: {rel}')


# Legacy vague names are rejected so ambiguous files cannot creep back into the maintained tree.
legacy_vague_paths = [
    'src/translator/README.md',
    'tools/qa/README.md',
    'tools/qa/TROUBLESHOOTING.md',
    'tools/qa/differential-review.json',
    'tools/qa/run-integrity.py',
    'tools/qa/run-node-qa.js',
    'tools/qa/run-release-qa.js',
    'tools/qa/run-browser-smoke-cdp.js',
    'tools/qa/run-failure-injection-cdp.js',
    'tools/qa/browser/browser-smoke.html',
    'tools/qa/browser/browser-smoke.js',
    'tools/qa/browser/failure-injection.html',
    'readme/integration.md',
    'readme/Required files summary.md',
    'data/kanji/index.json',
    'data/nouns/index.json',
    'data/compound-words/index.json',
    'data/compound-words/compound-word-origin-source-metadata.json',
    'data/nouns/nouns-tag-bank-1.json',
]
for rel in legacy_vague_paths:
    if (root / rel).exists(): errors.append(f'Legacy vague filename returned: {rel}')
for path in root.rglob('*'):
    if path.is_file() and path.name.lower() in {'readme.md', 'index.json'}:
        errors.append(f'Vague maintained filename: {path.relative_to(root)}')

# Temporary recovery/checkpoint artefacts and obvious duplicate release copies belong outside the maintained tree.
for path in root.rglob('*'):
    if not path.is_file():
        continue
    relative = str(path.relative_to(root)).replace('\\', '/')
    lower_name = path.name.lower()
    lower_stem = path.stem.lower()
    if (
        'checkpoint' in lower_name
        or 'preedit' in lower_name
        or 'pre-edit' in lower_name
        or re.search(r'(?:^|[-_. ])(?:session[-_. ]*)?(?:recovery|restore)(?:[-_. ]|$)', lower_stem)
        or re.search(r'(?:^|[-_. ])(?:temp|temporary)(?:[-_. ]|$)', lower_stem)
        or lower_name.endswith(('.tmp', '.temp', '.bak', '.old'))
    ):
        errors.append(f'Temporary checkpoint/recovery artefact in release tree: {relative}')
    if (
        re.search(r'\([12]\)(?=\.[^.]+$|$)', lower_name)
        or re.search(r'(?:^|[-_. ])(?:copy|latest|final|backup)(?:[-_. ]|$)', lower_stem)
    ):
        errors.append(f'Obvious duplicate/backup production file in release tree: {relative}')
    if re.search(r'(?:^|[-_. ])qa(?:[-_. ]+)(?:output|result|results|log|logs|tmp|temp)(?:[-_. ]|$)', lower_stem):
        errors.append(f'Temporary QA artefact in release tree: {relative}')

required_licence_files = [
    'licenses and sources/CJ2R-Translator-Project-License.md',
    'licenses and sources/Apache License.md',
    'licenses and sources/Kuromoji NOTICE.md',
    'licenses and sources/MIT License.md',
    'licenses and sources/Electronic Dictionary Research and Development Group License.md',
    'licenses and sources/CC BY-SA 4.0 Notice.md',
    'licenses and sources/Japanese-Language-Data-Attribution.md',
    'licenses and sources/Jitendex-Jiten-JMnedict Attribution.md',
    'licenses and sources/NINJAL Rendaku Attribution.md',
    'licenses and sources/Historical Kana Evidence Sources.md',
    'licenses and sources/KANJIDIC Attribution.md',
    'licenses and sources/Japanese-Wikipedia-Proper-Noun-Attribution.md',
    'licenses and sources/Japanese-Government-Data-Attribution.md',
    'licenses and sources/Unicode Data Attribution.md',
]
for rel in required_licence_files:
    path = root / rel
    if not path.exists():
        errors.append(f'Missing licence/attribution file: {rel}')
    elif not path.read_text(encoding='utf-8').strip():
        errors.append(f'Empty licence/attribution file: {rel}')
counts['licences'] = len(required_licence_files)

licence_dir = root / 'licenses and sources'
if licence_dir.exists():
    licence_files = sorted(path for path in licence_dir.glob('*.md') if path.is_file())
    licence_text = '\n'.join(path.read_text(encoding='utf-8', errors='replace') for path in licence_files)
    for stale in ['Self Study Quiz', 'WKOF', 'WaniKani Open Framework']:
        if stale in licence_text: errors.append(f'Stale unrelated licence text: {stale}')

    seen_licence_hashes = {}
    for path in licence_files:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in seen_licence_hashes:
            errors.append(f'Duplicate licence/source content: {seen_licence_hashes[digest]} and {path.relative_to(root)}')
        else:
            seen_licence_hashes[digest] = path.relative_to(root)

    edrdg_notice = licence_dir / 'Electronic Dictionary Research and Development Group License.md'
    if edrdg_notice.is_file():
        edrdg_text = edrdg_notice.read_text(encoding='utf-8', errors='replace')
        for required in ['https://www.edrdg.org/edrdg/licence.html', 'CJ2R update procedure', 'regular updating', 'tools/edrdg-update/cj2r-edrdg-updater.js', 'Warranty, liability and copyright conditions', 'KANJIDIC-specific conditions']:
            if required not in edrdg_text:
                errors.append(f'EDRDG notice missing required maintenance text: {required}')

build_check = subprocess.run(['node', str(root / 'tools' / 'build-translator-engine.js'), '--check', str(root)], capture_output=True, text=True)
if build_check.returncode:
    errors.append(f'Generated engine mismatch: {(build_check.stderr or build_check.stdout).strip()}')

dependency_check = subprocess.run(['node', str(root / 'tools' / 'qa' / 'run-translator-dependency-check.js'), str(root)], capture_output=True, text=True)
if dependency_check.returncode:
    errors.append(f'Source dependency check: {(dependency_check.stderr or dependency_check.stdout).strip()}')

contracts_path = root / 'src' / 'translator' / '00-contracts.js'
if contracts_path.is_file():
    contracts_text = contracts_path.read_text(encoding='utf-8')
    if re.search(r'@typedef\s*\{Record<string,\s*any>\}\s*CJ2RToken', contracts_text):
        errors.append('CJ2RToken regressed to an untyped catch-all Record<string, any> contract')
    if 'surface_form: string' not in contracts_text or 'readingResolution?: CJ2RReadingResolution' not in contracts_text:
        errors.append('CJ2RToken explicit pipeline contract is incomplete')

def require_ordered_markers(path, markers, label):
    if not path.is_file():
        return
    text = path.read_text(encoding='utf-8')
    positions = [text.find(marker) for marker in markers]
    if any(pos < 0 for pos in positions):
        missing = [marker for marker, pos in zip(markers, positions) if pos < 0]
        errors.append(f'{label} missing required resolver marker(s): {missing}')
    elif positions != sorted(positions):
        errors.append(f'{label} resolver precedence does not match executable order: {markers}')

require_ordered_markers(
    root / 'readme' / 'cj2r-architectural-control-flow.md',
    ['Typed temporal expression', 'Typed numeric expression', 'Authoritative span evidence'],
    'Architectural control flow'
)
require_ordered_markers(
    root / 'src' / 'translator' / 'translator-source-development-guide.md',
    ['R05 — Typed temporal expression', 'R06 — Typed numeric expression', 'R07 — Authoritative span'],
    'Source development guide'
)
required_files_summary = root / 'readme' / 'translator-required-files-summary.md'
if required_files_summary.is_file() and 'data/kanji/japanese-han-scope.json' not in required_files_summary.read_text(encoding='utf-8'):
    errors.append('Required-files summary omits optional runtime asset: data/kanji/japanese-han-scope.json')

engine = (root / 'translator-engine.js').read_text(encoding='utf-8')
for stale in ['SHOW_STATUS_BANNER', 'term_bank_', 'tag_bank_', 'kanji_bank_', 'jmnedict_bank_', "cache: 'no-store'"]:
    if stale in engine: errors.append(f'Stale engine text: {stale}')

# Every path declared in the runtime manifest must resolve, except the dictionary bundle directory.
manifest_paths = re.findall(r"paths:\s*\[([^\]]+)\]", engine)
for group in manifest_paths:
    for rel in re.findall(r"'([^']+)'", group):
        target = root / rel
        if not target.exists(): errors.append(f'Manifest path missing: {rel}')


provenance_path = root / 'data' / 'external-evidence-source-provenance.json'
if not provenance_path.exists():
    errors.append('Missing source provenance manifest: data/external-evidence-source-provenance.json')
else:
    try:
        provenance = json.loads(provenance_path.read_text(encoding='utf-8'))
        entries = provenance.get('entries') if isinstance(provenance, dict) else None
        if not isinstance(entries, list) or not entries:
            errors.append('Source provenance manifest has no entries')
        else:
            seen_provenance_paths = set()
            for entry in entries:
                rel = entry.get('path') if isinstance(entry, dict) else None
                expected_hash = entry.get('sha256') if isinstance(entry, dict) else None
                refs = entry.get('licenceRefs') if isinstance(entry, dict) else None
                sources = entry.get('sources') if isinstance(entry, dict) else None
                if not rel or rel in seen_provenance_paths:
                    errors.append(f'Invalid or duplicate provenance path: {rel}')
                    continue
                seen_provenance_paths.add(rel)
                target = root / rel
                if not target.is_file():
                    errors.append(f'Provenance target missing: {rel}')
                    continue
                actual_hash = hashlib.sha256(target.read_bytes()).hexdigest()
                if not re.fullmatch(r'[0-9a-f]{64}', str(expected_hash or '')) or actual_hash != expected_hash:
                    errors.append(f'Provenance hash mismatch: {rel}')
                if not isinstance(sources, list) or not sources:
                    errors.append(f'Provenance sources missing: {rel}')
                if not isinstance(refs, list) or not refs:
                    errors.append(f'Provenance licence references missing: {rel}')
                else:
                    for ref in refs:
                        if not (root / str(ref)).is_file():
                            errors.append(f'Provenance licence reference missing for {rel}: {ref}')
            counts['provenance'] = len(entries)
    except Exception as exc:
        errors.append(f'Source provenance manifest: {exc}')


classification_path = root / 'data' / 'translator-data-provenance-classification.json'
if not classification_path.exists():
    errors.append('Missing data provenance classification manifest: data/translator-data-provenance-classification.json')
else:
    try:
        classification = json.loads(classification_path.read_text(encoding='utf-8'))
        entries = classification.get('entries') if isinstance(classification, dict) else None
        allowed_classes = {'project-authored/manual', 'externally-derived', 'mixed', 'legacy/unknown'}
        allowed_statuses = {'complete', 'partial'}
        if not isinstance(entries, list) or not entries:
            errors.append('Data provenance classification manifest has no entries')
        else:
            seen_paths = set()
            for entry in entries:
                rel = entry.get('path') if isinstance(entry, dict) else None
                category = entry.get('classification') if isinstance(entry, dict) else None
                status = entry.get('status') if isinstance(entry, dict) else None
                basis = entry.get('sourceBasis') if isinstance(entry, dict) else None
                unresolved = entry.get('unresolved') if isinstance(entry, dict) else None
                refs = entry.get('licenceRefs') if isinstance(entry, dict) else None
                if not rel or rel in seen_paths:
                    errors.append(f'Invalid or duplicate data provenance classification path: {rel}')
                    continue
                seen_paths.add(rel)
                target = root / rel
                if not target.is_file():
                    errors.append(f'Data provenance classification target missing: {rel}')
                if category not in allowed_classes:
                    errors.append(f'Invalid data provenance classification for {rel}: {category}')
                if status not in allowed_statuses:
                    errors.append(f'Invalid data provenance status for {rel}: {status}')
                if not isinstance(basis, list) or not basis or not all(isinstance(item, str) and item.strip() for item in basis):
                    errors.append(f'Data provenance source basis missing: {rel}')
                if status == 'partial':
                    if not isinstance(unresolved, list) or not unresolved:
                        errors.append(f'Partial data provenance has no unresolved explanation: {rel}')
                    errors.append(f'Release data provenance remains partial: {rel}')
                if category == 'legacy/unknown' and status != 'partial':
                    errors.append(f'Legacy/unknown data provenance must remain partial: {rel}')
                if refs is not None:
                    if not isinstance(refs, list) or not refs:
                        errors.append(f'Invalid data provenance licence references: {rel}')
                    else:
                        for ref in refs:
                            if not (root / str(ref)).is_file():
                                errors.append(f'Data provenance licence reference missing for {rel}: {ref}')
                if category == 'externally-derived' and status == 'complete' and (not isinstance(refs, list) or not refs):
                    errors.append(f'Complete external data provenance lacks licence references: {rel}')

            expected_data_paths = {
                str(path.relative_to(root)).replace('\\', '/') for path in (root / 'data').rglob('*')
                if path.is_file() and path != classification_path
            }
            missing = sorted(expected_data_paths - seen_paths)
            extra = sorted(seen_paths - expected_data_paths)
            for rel in missing:
                errors.append(f'Unclassified maintained data file: {rel}')
            for rel in extra:
                errors.append(f'Data provenance classification points outside maintained data: {rel}')
            counts['provenance_classifications'] = len(entries)
    except Exception as exc:
        errors.append(f'Data provenance classification manifest: {exc}')

report = {
    'ok': not errors,
    'files': sum(1 for p in root.rglob('*') if p.is_file()),
    'counts': counts,
    'errors': errors
}
print(json.dumps(report, indent=2))
sys.exit(0 if report['ok'] else 2)
