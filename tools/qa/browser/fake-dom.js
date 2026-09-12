const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL, fileURLToPath } = require('url');

class FakeElement {
    constructor(id = '', tagName = 'DIV') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.hidden = false;
        this.style = {};
        this.attributes = new Map();
        this.disabled = false;
        this.tabIndex = 0;
        this.checked = true;
        this.value = '';
        this.textContent = '';
        this.innerText = '';
        this.innerHTML = '';
        this.className = '';
        this.title = '';
        this.src = '';
        this.async = false;
        this.listeners = new Map();
        this.parentNode = null;
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); if (name === 'disabled') this.disabled = false; }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    dispatchEvent(event) { for (const fn of this.listeners.get(event.type) || []) fn.call(this, event); return true; }
    click() { this.dispatchEvent({ type: 'click', preventDefault() {} }); }
    focus() {}
    remove() { if (this.parentNode?.removeChild) this.parentNode.removeChild(this); this.parentNode = null; }
}

function createNodeTranslatorContext(root) {
    const ids = ['status-banner', 'input', 'output', 'kanji-readings', 'kanji-search', 'override-control', 'overrides-enabled', 'license-notice', 'override-text'];
    const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id, id.includes('input') || id.includes('search') ? 'input' : 'div')]));
    elements.input = new FakeElement('input', 'textarea');
    elements['overrides-enabled'] = new FakeElement('overrides-enabled', 'input');
    elements['overrides-enabled'].checked = true;

    function resolveLocalUrl(url) {
        const raw = String(url || '');
        if (raw.startsWith('file://')) return fileURLToPath(raw);
        if (raw.startsWith('/')) return raw;
        return path.resolve(root, raw);
    }

    let context;
    const headChildren = [];
    const head = {
        appendChild(node) {
            node.parentNode = head;
            headChildren.push(node);
            if (node?.tagName === 'SCRIPT') {
                queueMicrotask(() => {
                    try {
                        const scriptPath = resolveLocalUrl(node.src);
                        const code = fs.readFileSync(scriptPath, 'utf8');
                        const previous = document.currentScript;
                        document.currentScript = node;
                        vm.runInContext(code, context, { filename: scriptPath });
                        document.currentScript = previous;
                        node.onload?.();
                    } catch (error) {
                        node.onerror?.(error);
                    }
                });
            }
            return node;
        },
        removeChild(node) {
            const index = headChildren.indexOf(node);
            if (index >= 0) headChildren.splice(index, 1);
            node.parentNode = null;
            return node;
        }
    };

    const document = {
        baseURI: pathToFileURL(path.join(root, 'index.html')).href,
        currentScript: { src: pathToFileURL(path.join(root, 'translator-engine.js')).href, nonce: '', getAttribute() { return null; } },
        head,
        createElement(tag) { return new FakeElement('', tag); },
        getElementById(id) { return elements[id] || null; },
        querySelector(selector) { return selector.startsWith('#') ? elements[selector.slice(1)] || null : null; }
    };

    class LocalXHR {
        open(method, url) { this.url = String(url); this.status = 0; this.statusText = ''; }
        send() {
            fs.readFile(resolveLocalUrl(this.url), (error, buffer) => {
                if (error) { this.status = 404; this.statusText = error.message; this.onerror?.(error); return; }
                this.status = 200;
                this.response = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                this.onload?.();
            });
        }
    }

    async function localFetch(input) {
        const target = resolveLocalUrl(input);
        try {
            const buffer = await fs.promises.readFile(target);
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                async json() { return JSON.parse(buffer.toString('utf8')); },
                async text() { return buffer.toString('utf8'); },
                async arrayBuffer() { return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength); }
            };
        } catch (error) {
            return {
                ok: false,
                status: 404,
                statusText: error.message,
                async json() { throw error; },
                async text() { return ''; },
                async arrayBuffer() { throw error; }
            };
        }
    }

    context = vm.createContext({
        console,
        document,
        window: null,
        Element: FakeElement,
        Event: class Event { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } preventDefault() {} },
        URL, URLSearchParams, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer, DataView,
        Map, Set, WeakMap, WeakSet, Promise, RegExp, JSON, Math, Date, Object, String,
        Number, Boolean, Symbol, Error, TypeError, SyntaxError, parseInt, parseFloat, isNaN,
        setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
        fetch: localFetch,
        XMLHttpRequest: LocalXHR,
        location: { href: pathToFileURL(path.join(root, 'index.html')).href, pathname: path.join(root, 'index.html'), search: '' }
    });
    context.window = context;
    context.globalThis = context;
    return { context, document, elements, FakeElement, resolveLocalUrl };
}

module.exports = { FakeElement, createNodeTranslatorContext };
