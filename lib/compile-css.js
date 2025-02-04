import { join } from 'path'
import { AsyncArray, getAssetPath, read } from './utils.js'
import * as sass from 'sass'
import postcss from 'postcss'
import { generateImages, getImageMediaQueries } from './compile-img.js'

export const compileCss = async ({
  doc,
  htmlPath,
  htmlInputPath,
  htmlOutputPath,
  basePath,
  inputDirectory,
  outputDirectory,
  compressOutput
}) => {
  const assets = await AsyncArray
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
      if (!href) {
        console.dir(element)
      }
      const assetPath = getAssetPath({ assetPath: href, htmlInputPath })
      return href
        ? await read(assetPath)
        : element.textContent
    })
    .awaitAll()

  const rawCss = await AsyncArray.from(assets)
    .filter(x => typeof x === 'string' && !!x)
    .map(async asset => {
      try {
        const result = await sass.compileString(asset, {
          loadPaths: [htmlInputPath],
          style: compressOutput ? 'compressed' : 'expanded'
        })
        return result?.css || ''
      } catch (e) {
        console.error(e)
        return ''
      }
    })
    .awaitAll()

  const css = await updateBackgroundImages(rawCss.join('\n'), inputDirectory, outputDirectory)
  const style = doc.createElement('style')
  style.textContent = css
  doc.head.append(style)
}

const urlRe = /url\(([^)]+)\)/
const updateBackgroundImages = async (css, inputDir, outputDir) => {
  const responsiveImagePlugin = (opts = {}) => {
    return {
      postcssPlugin: 'postcss-responsive-images',
      Declaration: {
        'background-image': async (node, {
          AtRule,
          Declaration
        }) => {
          // if declaration's parent is a media query, return
          const { type: parentType, name: parentName } = node?.parent || {}
          if (parentType === 'atrule' && parentName === 'media') return
          const url = node.value.match(urlRe)?.[1]
          if (!url) return
          const file = join(inputDir, url)
          const imageMetaArr = await generateImages({ file, inputDir, outputDir })
          const atRuleMetaArr = await getImageMediaQueries(imageMetaArr)
          atRuleMetaArr.forEach(({ condition, value }) => {
            const mediaQuery = new AtRule({ name: 'media', params: condition })
            const declaration = new Declaration({
              prop: 'background-image',
              value
            })
            mediaQuery.append(declaration)
            node.parent.append(mediaQuery)
          })
        }
      }
    }
  }
  responsiveImagePlugin.postcss = true
  return postcss([responsiveImagePlugin])
    .process(css, { from: undefined })
    .then(result => result.css)
}
