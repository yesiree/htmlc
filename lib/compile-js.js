import  { join } from 'path'
import { read } from './utils.js'


export const compileJs = async ({
  doc,
  basePath,
  source,
  dest,
  compress,
  module
}) => {
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
  )).join(';\n').trim()
  if (!js) return
  if (compress) {
    try {
      const result = await terser.minify(js, { toplevel: true })
      js = result.code || ''
    } catch (e) { /* ignore syntax errors from terser */ }
  }
  const script = doc.createElement('script')
  script.textContent = `\n${js}`
  if (module) script.setAttribute('type', 'module')
  doc.body.append(script)
}
