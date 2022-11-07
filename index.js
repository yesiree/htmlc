#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlc = exports.write = exports.read = void 0;
const path_1 = require("path");
const terser_1 = __importDefault(require("terser"));
const jsdom_1 = __importDefault(require("jsdom"));
const postcss_1 = __importDefault(require("postcss"));
const postcss_nested_1 = __importDefault(require("postcss-nested"));
const cssnano_1 = __importDefault(require("cssnano"));
const html_minifier_1 = __importDefault(require("html-minifier"));
const js_beautify_1 = __importDefault(require("js-beautify"));
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const minimist_1 = __importDefault(require("minimist"));
const read = (path) => {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(path, (err, data) => {
            if (err)
                return reject(err);
            resolve(data.toString());
        });
    });
};
exports.read = read;
const write = (path, data) => {
    return new Promise(async (resolve, reject) => {
        if (typeof data !== 'string')
            data = JSON.stringify(data);
        const dir = (0, path_1.dirname)(path);
        await (0, mkdirp_1.default)(dir);
        fs_1.default.writeFile(path, data, err => {
            if (err)
                return reject(err);
            resolve();
        });
    });
};
exports.write = write;
const getBasePath = (src, dom) => {
    const srcDir = (0, path_1.dirname)(src);
    const base = dom.window.document.querySelector('base[href]');
    const baseUrl = base ? base.getAttribute('href') : null;
    return baseUrl !== null
        ? (0, path_1.resolve)(srcDir, baseUrl)
        : srcDir;
};
const compile = async ({ src, out, compress, module }) => {
    const dom = new jsdom_1.default.JSDOM(await (0, exports.read)(src), {
        virtualConsole: new jsdom_1.default.VirtualConsole()
    });
    const doc = dom.window.document;
    const root = getBasePath(src, dom);
    const plugins = [postcss_nested_1.default];
    if (compress)
        plugins.push(cssnano_1.default);
    const cssMinifier = (0, postcss_1.default)(plugins);
    const cssPromise = Promise.all(Array
        .from(doc.querySelectorAll('link[rel="stylesheet"]'))
        .map(async (styleLink) => {
        const path = (0, path_1.resolve)(root, styleLink.getAttribute('href') || '');
        const css = await (0, exports.read)(path);
        const style = doc.createElement('style');
        style.setAttribute('path', path);
        style.textContent = css;
        styleLink.replaceWith(style);
        return style;
    })).then(async () => {
        const styles = await Promise.all(Array
            .from(doc.querySelectorAll('style'))
            .map(async (style) => {
            const from = style.getAttribute('path') || undefined;
            const result = await cssMinifier.process(style.textContent || '', {
                from
            });
            style.remove();
            return result.css;
        }));
        const css = styles.join(' ');
        const style = doc.createElement('style');
        style.textContent = css;
        doc.head.append(style);
    });
    const jsPromise = Promise
        .all(Array
        .from(doc.querySelectorAll('script[src]'))
        .map(async (script) => {
        const path = (0, path_1.resolve)(root, script.getAttribute('src') || '');
        script.textContent = await (0, exports.read)(path);
        script.removeAttribute('src');
    }))
        .then(async () => {
        let code = Array
            .from(doc.querySelectorAll('script'))
            .map(script => {
            const text = script.textContent;
            script.remove();
            return text;
        })
            .join(';');
        const script = doc.createElement('script');
        if (compress) {
            const result = await terser_1.default.minify(code, { toplevel: true });
            code = result.code || '';
        }
        script.textContent = `\n${code}`;
        if (module)
            script.setAttribute('type', 'module');
        doc.body.append(script);
    });
    await Promise.all([cssPromise, jsPromise]);
    const html = compress
        ? html_minifier_1.default.minify(dom.serialize(), {
            collapseWhitespace: true,
            removeComments: true,
        })
        : js_beautify_1.default.html(dom.serialize(), {
            indent_size: 2,
            indent_char: ' ',
            eol: '\n',
            preserve_newlines: false
        });
    await (0, exports.write)(out, html);
};
const htmlc = async ({ src, out, watch, compress, module }) => {
    if (watch) {
        const sourceGlob = (0, path_1.resolve)((0, path_1.dirname)(src), '**');
        const update = () => compile({ src, out, compress, module });
        return chokidar_1.default
            .watch(sourceGlob)
            .on('change', update)
            .on('add', update)
            .on('unlink', update);
    }
    else {
        await compile({ src, out, compress, module });
    }
};
exports.htmlc = htmlc;
if (module === require.main) {
    const args = (0, minimist_1.default)(process.argv.slice(2));
    const source = args.s || args.src || args.source || 'src/index.html';
    const output = args.o || args.out || args.output || 'out/index.html';
    const watch = args.w || args.watch || false;
    const compress = args.c || args.compress || false;
    const module = args.m || args.module || false;
    (0, exports.htmlc)({ src: source, out: output, watch, compress: compress, module });
}
