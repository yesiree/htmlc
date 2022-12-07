import { dirname, resolve, join, relative, extname } from 'path'
import * as terser from 'terser'
import jsdom from 'jsdom'
import sass from 'sass'
import htmlMinifier from 'html-minifier'
import htmlFormatter from 'js-beautify'
import chokidar from 'chokidar'
import chalk from 'chalk'
import fastGlob from 'fast-glob'
import mime from 'mime-types'
import { read, read64, write, copy, getPkgVersion } from './utils.js'


// const deferred = (resolve) => ({ ...new Promise(res => resolve = res), resolve })

const log = (message, {
  time = true,
} = {}) => {
  if (log.quiet || !console || !console.log) return
  const timestamp = chalk.gray(`[${log.timestamp()}]: `)
  console.log(`${time ? timestamp : ''}${message}`)
}
log.quiet = false
log.timestamp = () => {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = ('' + (date.getMonth() + 1)).padStart(2, '0')
  const dd = ('' + date.getDate()).padStart(2, '0')
  const hh = ('' + date.getHours()).padStart(2, '0')
  const min = ('' + date.getMinutes()).padStart(2, '0')
  const sec = ('' + date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
}

const getBasePath = (src, dom) => {
  const source = dirname(src)
  const base = dom.window.document.querySelector('base[href]')
  const baseUrl = base ? base.getAttribute('href') : null
  return baseUrl !== null
    ? resolve(source, baseUrl)
    : source
}

const compileFile = async (
  htmlPath, {
    source = '',
    dist = './',
    compress = true,
    module = true,
  }
) => {
  const dom = new jsdom.JSDOM(
    await read(htmlPath), {
      virtualConsole: new jsdom.VirtualConsole()
    }
  )

  const doc = dom.window.document
  const basePath = getBasePath(htmlPath, dom)

  await Promise.all([
    Promise.resolve().then(async () => {
      await Promise.all(
        Array
          .from(doc.querySelectorAll('img[src]'))
          .map(async element => {
            const src = element.getAttribute('src')
            const inline = element.hasAttribute('inline')
            element.removeAttribute('inline')
            if (inline) {
              const mimeType = mime.lookup(extname(src))
              const data64 = await read64(join(basePath, src))
              element.setAttribute('src', `data:${mimeType};base64,${data64}`)
            } else {
              const inPath = join(basePath, src)
              const outPath = join(dist, src)
              await copy(inPath, outPath)
            }
          })
      )
    }),
    Promise.resolve().then(async () => {
      const assets = await Promise.all(
        Array
          .from(doc.querySelectorAll('link[rel="stylesheet"],style'))
          .map(async element => {
            element.remove()
            const href = element.getAttribute('href')
            return href
              ? await read(join(basePath, href))
              : element.textContent
          })
      )
      const css = await Promise.all(
        assets
          .filter(x => typeof x === 'string' && !!x)
          .map(async asset => {
            try {
              return await sass.compileString(asset, {
                loadPaths: [basePath],
                style: compress ? 'compressed' : 'expanded'
              })?.css || ''
            } catch (e) {
              console.error(e)
              return ''
            }
          })
      )
      const style = doc.createElement('style')
      style.textContent = css.join('\n')
      doc.head.append(style)
    }),
    Promise.resolve().then(async () => {
      let js = (await Promise.all(
        Array
          .from(doc.querySelectorAll('script'))
          .map(async element => {
            element.remove()
            const src = element.getAttribute('src')
            return src
              ? await read(join(basePath, src))
              : element.textContent
          })
      )).join(';\n')
      if (compress || true) {
        try {
          const result = await terser.minify(js, { toplevel: true })
          js = result.code || ''
        } catch (e) { /* ignore syntax errors from terser */ }
      }
      const script = doc.createElement('script')
      script.textContent = `\n${js}`
      if (module) script.setAttribute('type', 'module')
      doc.body.append(script)
    })
  ])

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

  const distPath = join(dist, relative(source, htmlPath))
  await write(distPath, html)
}

const types = {
  'MOD': chalk.magenta('MOD'),
  'ADD': chalk.green('ADD'),
  'DEL': chalk.red('DEL'),
  'RDY': chalk.blue('READY'),
}

const styles = {
  path: chalk.blueBright,
  success: chalk.greenBright
}

/**
 * @param {object} options
 * @param {string} options.source — The source directory from which content will be compiled.
 * @param {string} options.dist — The output directory to which compiled content will be written.
 * @param {string} options.watch — If true, `htmlc` will continue to watch the file system and re-compile whenever changes are detected.
 * @param {string} options.compress — If true, html, css, and javascript will be compressed.
 * @param {string} options.module — If true, scripts will have their `type` attribute set to `module`.
 * @param {string} options.ext — The extension of the compiled HTML files. Defaults to `.html`, but can be altered to accommodate the file extensions of templating engines such as nunjucks.
 *
 * @returns {Promise<void>}
 */
export const htmlc = async ({
  source = 'src/',
  dist = 'dist/',
  watch = false,
  compress = true,
  module = true,
  ext = '.html',
  quiet = false
} = {}) => {
  log.quiet = quiet
  const opts = {
    source,
    dist,
    compress,
    module,
  }
  try {
    const glob = join(source, '**')
    const htmlRegistry = []
    const initial = []
    let isReady = false
    if (watch) {
      const remove = async (type, path) => {
        if (path.endsWith('ext')) {
          const index = htmlRegistry.indexOf(path)
          if (index > -1) htmlRegistry.splice(index, 1)
        }
        log(`${types[type]} ${path}`)
      }
      const update = async (type, path = '') => {
        await Promise.all(
          htmlRegistry.map(x => compileFile(x, opts))
        )
        if (type === 'RDY') {
          isReady = true
          await Promise.all(initial)
        }
        log(`${types[type]} ${path}`)
      }
      const register = async (type, path) => {
        if (path.endsWith(ext)) {
          htmlRegistry.push(path)
          const promise = compileFile(path, opts)
          if (!isReady) initial.push(promise)
          await promise
        }
        log(`${types[type]} ${path}`)
      }
      return chokidar
        .watch(glob)
        .on('add', register.bind(null, 'ADD'))
        .on('change', update.bind(null, 'MOD'))
        .on('unlink', remove.bind(null, 'DEL'))
        .on('ready', update.bind(null, 'RDY'))
    } else {
      const version = await getPkgVersion()
      log(`htmlc v${version}`)
      const files = await fastGlob(glob)
      const { length: count } = await Promise.all(
        files
          .filter(x => x.endsWith(ext))
          .map(async htmlFile => {
            log(`Compiling ${styles.path(htmlFile)}...`)
            await compileFile(htmlFile, opts)
          })
      )
      const plural = count === 1 ? '' : 's'
      log(`${styles.success('Finished')} — ${count} file${plural} compiled.`)
    }
  } catch (e) {
    console.error(e)
  }
}
