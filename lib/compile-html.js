import { dirname, join, relative } from 'path'
import jsdom from 'jsdom'
import htmlMinifier from 'html-minifier-terser'
import htmlFormatter from 'js-beautify'
import nunjucks from 'nunjucks'
import { compileImages } from './compile-img.js'
import { compileCss } from './compile-css.js'
import { compileJs } from './compile-js.js'
import { getPathParts, read, write } from './utils.js'

export const compileHtml = async (
  htmlPath, {
    inputDirectory = '',
    outputDirectory = './',
    compressOutput = true,
    outputES6Modules = true,
    addTrailingIndex = false,
    optimizeImages = false,
    data = {},
  }
) => {
  const inputHtml = await read(htmlPath)
  const processedHtml = await preprocessHtml(inputHtml, data)
  const { dom } = await getDom(processedHtml)
  const doc = dom.window.document
  const basePath = getBasePath(htmlPath, dom)

  await Promise.all([
    compileImages({ doc, htmlPath, basePath, source: inputDirectory, destination: outputDirectory, optimizeImages }),
    compileJs({ doc, htmlPath, basePath, source: inputDirectory, destination: outputDirectory, compress: compressOutput, module: outputES6Modules }),
    compileCss({ doc, htmlPath, basePath, source: inputDirectory, destination: outputDirectory, compress: compressOutput }),
  ])

  const outputHtml = compressOutput
    ? await htmlMinifier.minify(dom.serialize(), minifyOpts)
    : await htmlFormatter.html(dom.serialize(), formatOpts)

  htmlPath = addTrailingIndex ? getAsIndexPath(htmlPath) : htmlPath
  let destPath = join(outputDirectory, relative(inputDirectory, htmlPath))
  await write(destPath, outputHtml)
  return destPath
}

const minifyOpts = {
  collapseWhitespace: true,
  removeComments: true,
}

const formatOpts = {
  indent_size: 2,
  indent_char: ' ',
  eol: '\n',
  preserve_newlines: false
}

const env = nunjucks.configure()
const preprocessHtml = async (html, context) => {
  return nunjucks.renderString(html, context)
}

const getDom = async (html) => {
  const virtualConsole = new jsdom.VirtualConsole()
  const dom = new jsdom.JSDOM(html, { virtualConsole })
  return { html, dom, virtualConsole }
}

const getBasePath = (src, dom) => {
  const source = dirname(src)
  const base = dom.window.document.querySelector('base[href]')
  const baseUrl = base ? base.getAttribute('href') : null
  return baseUrl !== null
    ? resolve(source, baseUrl)
    : source
}

export const getAsIndexPath = (path) => {
  const { dir, name, ext } = getPathParts(path)
  if (name === 'index') return path
  return join(dir, name, `index${ext}`)
}
