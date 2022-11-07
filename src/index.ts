#!/usr/bin/env node

import { dirname, resolve } from 'path'
import terser from 'terser'
import jsdom from 'jsdom'
import postcss from 'postcss'
import nestedcss from 'postcss-nested'
import cssnano from 'cssnano'
import htmlMinifier from 'html-minifier'
import htmlFormatter from 'js-beautify'
import chokidar from 'chokidar'
import fs from 'fs'
import mkdirp from 'mkdirp'
import minimist from 'minimist'


export const read = (path: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, (err: any, data: any) => {
      if (err) return reject(err)
      resolve(data.toString())
    })
  })
}

export const write = (path: string, data: any): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    if (typeof data !== 'string') data = JSON.stringify(data)
    const dir = dirname(path)
    await mkdirp(dir)
    fs.writeFile(path, data, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const getBasePath = (src: string, dom: jsdom.JSDOM) => {
  const srcDir = dirname(src)
  const base = dom.window.document.querySelector('base[href]')
  const baseUrl = base ? base.getAttribute('href') : null
  return baseUrl !== null
    ? resolve(srcDir, baseUrl)
    : srcDir
}

const compile = async({ src, out, compress, module }: {
  src: string
  out: string
  compress: boolean
  module: boolean
}) => {
  const dom = new jsdom.JSDOM(
    await read(src), {
    virtualConsole: new jsdom.VirtualConsole()
  })
  const doc = dom.window.document
  const root = getBasePath(src, dom)

  const plugins: any[] = [nestedcss]
  if (compress) plugins.push(cssnano)

  const cssMinifier = postcss(plugins)
  const cssPromise = Promise.all(
    Array
      .from(doc.querySelectorAll('link[rel="stylesheet"]'))
      .map(async styleLink => {
        const path = resolve(root, styleLink.getAttribute('href') || '')
        const css = await read(path)
        const style = doc.createElement('style')
        style.setAttribute('path', path)
        style.textContent = css
        styleLink.replaceWith(style)
        return style
      })
  ).then(async () => {
    const styles = await Promise.all(
      Array
        .from(doc.querySelectorAll('style'))
        .map(async style => {
          const from = style.getAttribute('path') || undefined
          const result = await cssMinifier.process(
            style.textContent || '', {
            from
          })
          style.remove()
          return result.css
        })
    )
    const css = styles.join(' ')
    const style = doc.createElement('style')
    style.textContent = css
    doc.head.append(style)
  })

  const jsPromise = Promise
    .all(
      Array
        .from(doc.querySelectorAll('script[src]'))
        .map(async script => {
          const path = resolve(root, script.getAttribute('src') || '')
          script.textContent = await read(path)
          script.removeAttribute('src')
        })
    )
    .then(async () => {
      let code = Array
        .from(doc.querySelectorAll('script'))
        .map(script => {
          const text = script.textContent
          script.remove()
          return text
        })
        .join(';')
      const script = doc.createElement('script')
      if (compress) {
        const result = await terser.minify(code, { toplevel: true })
        code = result.code || ''
      }
      script.textContent = `\n${code}`
      if (module) script.setAttribute('type', 'module')
      doc.body.append(script)
    })


  await Promise.all([cssPromise, jsPromise])

  const html = compress
    ? htmlMinifier.minify(dom.serialize(), {
      collapseWhitespace: true,
      removeComments: true,
    })
    : htmlFormatter.html(dom.serialize(), {
      indent_size: 2,
      indent_char: ' ',
      eol: '\n',
      preserve_newlines: false
    })

  await write(out, html)
}


export const htmlc = async ({ src, out, watch, compress, module }: {
  src: string
  out: string
  watch: boolean
  compress: boolean
  module: boolean
}) => {
  if (watch) {
    const sourceGlob = resolve(dirname(src), '**')
    const update = () => compile({ src, out, compress, module })
    return chokidar
      .watch(sourceGlob)
      .on('change', update)
      .on('add', update)
      .on('unlink', update)
  } else {
    await compile({ src, out, compress, module })
  }
}


if (module === require.main) {
  const args = minimist(process.argv.slice(2))
  const source = args.s || args.src || args.source || 'src/index.html'
  const output = args.o || args.out || args.output || 'out/index.html'
  const watch = args.w || args.watch || false
  const compress = args.c || args.compress || false
  const module = args.m || args.module || false
  htmlc({ src: source, out: output, watch, compress: compress, module })
}
