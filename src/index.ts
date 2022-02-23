#!/usr/bin/env node

import { dirname, resolve } from 'path'
import terser from 'terser'
import jsdom from 'jsdom'
import postcss from 'postcss'
import nestedcss from 'postcss-nested'
import cssnano from 'cssnano'
import htmlMinifier from 'html-minifier'
import chokidar from 'chokidar'
import fs from 'fs'
import mkdirp from 'mkdirp'


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

export const htmlc = async ({ src, dest }: {
  src: string
  dest: string
}) => {
  const dom = new jsdom.JSDOM(
    await read(src), {
    virtualConsole: new jsdom.VirtualConsole()
  })
  const doc = dom.window.document
  const root = getBasePath(src, dom)

  const cssMinifier = postcss([nestedcss, cssnano])
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
      const code = Array
        .from(doc.querySelectorAll('script'))
        .map(script => {
          const text = script.textContent
          script.remove()
          return text
        })
        .join(';')
      const script = doc.createElement('script')
      const result = await terser.minify(code, { toplevel: true })
      script.textContent = result.code || ''
      doc.body.append(script)
    })


  await Promise.all([cssPromise, jsPromise])

  const html = htmlMinifier.minify(dom.serialize(), {
    collapseWhitespace: true,
    removeComments: true
  })

  await write(dest, html)
}


if (module === require.main) {
  const src = process.argv[2] || './src/index.html'
  const dest = process.argv[3] || './dist/index.html'
  const watch = process.argv[4] === 'watch'
  try {
    if (watch) {
      const srcGlob = resolve(dirname(src), '**')
      const update = () => htmlc({ src, dest })
      chokidar
        .watch(srcGlob)
        .on('change', update)
        .on(' unlink', update)
        .on('add', update)
    } else {
      htmlc({ src, dest })
    }
  } catch (err) {
    console.error(err)
  }
}
