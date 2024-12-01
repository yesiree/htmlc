import { join } from 'path'
import { read } from './utils.js'
import * as sass from 'sass'


export const compileCss = async ({
  doc,
  htmlPath,
  basePath,
  source,
  dest,
  compress
}) => {
  const assets = await Promise.all(
    Array
      .from(doc.querySelectorAll('link[rel="stylesheet"],style'))
      .filter(element => {
        const href = element.getAttribute('href')
        return !href || (
          !href.startsWith('http')
          && !href.startsWith('//')
        )
      })
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
}
