import { dirname, join, relative, resolve } from 'path'
import jsdom from 'jsdom'
import htmlMinifier from 'html-minifier-terser'
import htmlFormatter from 'js-beautify'
import nunjucks from 'nunjucks'
import { compileImages } from './compile-img.js'
import { compileCss } from './compile-css.js'
import { compileJs } from './compile-js.js'
import { getHtmlOutputPath, getHtmlPath, read, write } from './utils.js'


export const compileHtml = async (
  htmlInputPath, {
    inputDirectory = './src',
    outputDirectory = './dst',
    compressOutput = true,
    outputES6Modules = true,
    addTrailingIndex = false,
    optimizeImages = false,
    data = {},
  }
) => {
  const inputHtml = await read(htmlInputPath)
  const processedHtml = await preprocessHtml(inputHtml, data)
  const { dom } = await getDom(processedHtml)
  const doc = dom.window.document
  const htmlPath = getHtmlPath({ htmlInputPath, inputDirectory, addTrailingIndex })
  const htmlOutputPath = getHtmlOutputPath({ htmlPath, outputDirectory, addTrailingIndex })

  console.log(' > htmlPath:', htmlPath)

  const compileOpts = {
    doc,
    htmlPath,
    htmlInputPath,
    htmlOutputPath,
    inputDirectory,
    outputDirectory,
    optimizeImages,
    compressOutput,
    outputES6Modules
  }

  await Promise.all([
    compileImages(compileOpts),
    compileJs(compileOpts),
    compileCss(compileOpts),
  ])

  const outputHtml = compressOutput
    ? await htmlMinifier.minify(dom.serialize(), minifyOpts)
    : await htmlFormatter.html(dom.serialize(), formatOpts)

  let destPath = join(outputDirectory, relative(inputDirectory, htmlOutputPath))
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
