import fs from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import mkdirp from 'mkdirp'


export const read = path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) return reject(err)
      resolve(data.toString())
    })
  })
}

export const readJson = async path => {
  const data = await read(path)
  try {
    return JSON.parse(data)
  } catch (e) {
    return {}
  }
}

export const read64 = async path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) return reject(err)
      resolve(data.toString('base64'))
    })
  })
}

export const copy = async (src, dist) => {
  return new Promise(async (resolve, reject) => {
    await mkdirp(dirname(dist))
    const input = fs.createReadStream(src)
    const output = fs.createWriteStream(dist)
    input.pipe(output)
    input.on('error', reject)
    output.on('error', reject)
    output.on('finish', resolve)
  })
}

export const write = (path, data) => {
  return new Promise(async (resolve, reject) => {
    if (typeof data !== 'string') data = JSON.stringify(data)
    const dir = dirname(path)
    await mkdirp(dir)
    fs.writeFile(path, data, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export const getPkgVersion = async () => {
  const packageJson = join(dirname(fileURLToPath(import.meta.url)), '../package.json')
  const { version = '' } = await readJson(packageJson)
  return version
}

export const getPathParts = path => {
  const dir = dirname(path)
  const base = basename(path)
  const ext = extname(base)
  const parts = base.split('.')
  const meta = parts.slice(1, -1)
  const name = parts.slice(0, 1).join('.')
  const core = parts[0]
  return { original: path, dir, base, name, core, meta, ext }
}

export const getAsIndexPath = (path) => {
  const { dir, name, ext } = getPathParts(path)
  if (name === 'index') return path
  return join(dir, name, `index${ext}`)
}
