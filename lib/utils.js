import fs from 'fs'
import { join, dirname } from 'path'
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
