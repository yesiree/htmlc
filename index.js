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
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const mkdirp_1 = __importDefault(require("mkdirp"));
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
const htmlc = async ({ src, dest }) => {
    const dom = new jsdom_1.default.JSDOM(await (0, exports.read)(src), {
        virtualConsole: new jsdom_1.default.VirtualConsole()
    });
    const doc = dom.window.document;
    const root = getBasePath(src, dom);
    const cssMinifier = (0, postcss_1.default)([postcss_nested_1.default, cssnano_1.default]);
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
        const code = Array
            .from(doc.querySelectorAll('script'))
            .map(script => {
            const text = script.textContent;
            script.remove();
            return text;
        })
            .join(';');
        const script = doc.createElement('script');
        const result = await terser_1.default.minify(code, { toplevel: true });
        script.textContent = result.code || '';
        doc.body.append(script);
    });
    await Promise.all([cssPromise, jsPromise]);
    const html = html_minifier_1.default.minify(dom.serialize(), {
        collapseWhitespace: true,
        removeComments: true
    });
    await (0, exports.write)(dest, html);
};
exports.htmlc = htmlc;
if (module === require.main) {
    const src = process.argv[2] || './src/index.html';
    const dest = process.argv[3] || './dist/index.html';
    const watch = process.argv[4] === 'watch';
    try {
        if (watch) {
            const srcGlob = (0, path_1.resolve)((0, path_1.dirname)(src), '**');
            const update = () => (0, exports.htmlc)({ src, dest });
            chokidar_1.default
                .watch(srcGlob)
                .on('change', update)
                .on(' unlink', update)
                .on('add', update);
        }
        else {
            (0, exports.htmlc)({ src, dest });
        }
    }
    catch (err) {
        console.error(err);
    }
}
