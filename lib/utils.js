import fs from 'fs/promises'
import { relative } from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { join, dirname, basename, extname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { mkdirp } from 'mkdirp'
import getFilenamesFromGlob from 'fast-glob'

export class AsyncArray extends Array {
  static from(iterable) {
    return new AsyncArray(...iterable)
  }
  async awaitAll() {
    return AsyncArray.from(await Promise.all(this))
  }
}

export const read = async (path, encoding = 'utf8') => {
  const buffer = await fs.readFile(path)
  return buffer.toString(encoding)
}

export const readJson = async path => {
  const data = await read(path)
  try {
    return JSON.parse(data)
  } catch (e) {
    return {}
  }
}

export const read64 = async path => read(path, 'base64')

export const write = async (path, data) => {
  data = typeof data === 'string'
    ? data
    : JSON.stringify(data)
  const dir = dirname(path)
  await mkdirp(dir)
  await fs.writeFile(path, data)
}

export const copy = async (src, dist) => {
  return new Promise(async (resolve, reject) => {
    await mkdirp(dirname(dist))
    const input = createReadStream(src)
    const output = createWriteStream(dist)
    input.pipe(output)
    input.on('error', reject)
    output.on('error', reject)
    output.on('finish', resolve)
  })
}

export const copyFiles = async (source, dest, pattern) => {
  const files = await getFilenamesFromGlob(join(source, pattern))
  return Promise.all(
    files.map(async inPath => {
      const outPath = join(dest, relative(source, inPath))
      try {
        await copy(inPath, outPath)
      } catch (e) {
        console.error(`Failed to copy ${inPath} to ${outPath}.`)
      }
    })
  )
}

export const getPkgVersion = async () => {
  const pkgPath = fileURLToPath(import.meta.url)
  const pkgDir = dirname(pkgPath)
  const packageJson = join(pkgDir, '../package.json')
  const { version = '' } = await readJson(packageJson)
  return version
}

export const getAsIndexPath = (path) => {
  const { dir, name, ext } = getPathParts(path)
  if (name === 'index') return path
  return join(dir, name, `index${ext}`)
}

export const getHtmlPath = ({
  htmlInputPath,
  inputDirectory,
  addTrailingIndex,
}) => {
  const htmlPath = addTrailingIndex ? getAsIndexPath(htmlInputPath) : htmlInputPath
  return relative(inputDirectory, htmlPath)
}

export const getHtmlOutputPath = ({
  htmlPath,
  outputDirectory,
  addTrailingIndex = false,
}) => {
  const htmlOutputPath = addTrailingIndex ? getAsIndexPath(htmlPath) : htmlPath
  return resolve(outputDirectory, htmlOutputPath)
}

export const getAssetUri = ({
  assetPath,
  htmlOutputPath,
}) => {
  if (assetPath.startsWith('/')) return assetPath
  return join(dirname(htmlOutputPath), assetPath)
}

export const getAssetPath = ({
  assetPath,
  htmlInputPath,
}) => {
  console.log(' > assetPath:', assetPath)
  if (assetPath.startsWith('/')) return assetPath.slice(1)
  return join(dirname(htmlInputPath), assetPath)
}

export const getPathParts = path => {
  const dir = dirname(path)
  const base = basename(path)
  const ext = extname(base)
  const parts = base.split('.')
  const meta = parts.slice(1, -1)
  const name = parts.slice(0, -1).join('.')
  const core = parts[0]
  return {
    original: path, // /path/to/file.meta1.meta2.ext
    dir,            // /path/to
    base,           // file.meta1.meta2.ext
    name,           // file.meta1.meta2
    core,           // file
    meta,           // [meta1, meta2]
    ext             // .ext
  }
}

export const getRelativePath = (rootPath, path) => {
  return relative(resolve(rootPath), resolve(path))
}

export const getResolvedPath = (htmlPath, path) => {
  return resolve(dirname(htmlPath), path)
}

export class HtmlPath {
  constructor({ htmlFilePath, sourceDir, destDir }) {
    this.htmlFilePath = htmlFilePath
    this.outputPath

    this.sourceDir = sourceDir
    this.destDir = destDir
    // this.htmlFileDir = dirname(htmlFilePath)
  }

  get destPath() {
    const relativeHtmlPath = getRelativePath(inputDir, this.htmlFilePath)
  }

  resourceInputPath(relativePath) {
    return getRelativePath(this.htmlFileDir, relativePath)
  }

  resourceOutputPath(relativePath) {

    return resolve(this.htmlFileDir, relativePath)
  }
}


const exampleFile = {
  type: 'html | resource',
  inputPath: '/Users/username/projects/project/src/about.html',
  outputPath: '/Users/username/projects/project/dest/about/index.html',
  resolveInputResource(resourcePath) {
    return resolve(dirname(this.inputPath), resourcePath)
  },
  resolveOutputResource(resourcePath) {
    return resolve(dirname(this.outputPath), resourcePath)
  }
}
