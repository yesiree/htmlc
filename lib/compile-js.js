import  { join } from 'path'
import { read } from './utils.js'


export const compileJs = async ({
  doc,
  htmlInputPath,
  htmlOutputPath,
  basePath,
  inputDirectory,
  outputDirectory,
  compressOutput,
  outputES6Modules
}) => {
  let js = (await Promise.all(
    Array
      .from(doc.querySelectorAll('script'))
      .filter(element => {
        const src = element.getAttribute('src')
        return !src || (
          !src.startsWith('http')
          && !src.startsWith('//')
        )
      })
      .map(async element => {
        element.remove()
        const src = element.getAttribute('src')
        return src
          ? await read(join(inputDirectory, src))
          : element.textContent
      })
  )).join(';\n').trim()
  if (!js) return
  if (compressOutput) {
    try {
      const result = await terser.minify(js, { toplevel: true })
      js = result.code || ''
    } catch (e) { /* ignore syntax errors from terser */ }
  }
  const script = doc.createElement('script')
  script.textContent = `\n${js}`
  if (outputES6Modules) script.setAttribute('type', 'module')
  doc.body.append(script)
}
