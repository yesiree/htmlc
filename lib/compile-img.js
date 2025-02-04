import sharp from 'sharp'
import { join, relative, resolve, dirname } from 'path'
import { AsyncArray, getPathParts, getResolvedPath } from './utils.js'
import { mkdirp } from 'mkdirp'


const sizes = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]

const getImageSizes = (width, height, sizes, maxWidth = 2400) => {
  const topWidth = maxWidth > 0 ? Math.min(width, maxWidth) : width
  const topHeight = Math.floor((topWidth / width) * height)
  return AsyncArray
    .from(sizes)
    .map(percent => ({
      width: Math.floor(topWidth * percent),
      height: Math.floor(topHeight * percent),
    }))
}

const getImagePath = (file, inputDir, outputDir, size) => {
  const { name } = getPathParts(file)
  const relativeDir = dirname(relative(resolve(inputDir), resolve(file)))
  const relativePath = join(relativeDir, `${name}_${size}w.webp`)
  const outputPath = join(outputDir, relativePath)
  return { relativePath, outputPath }
}

export const generateImages = async ({
  file,
  inputDir,
  outputDir,
}) => {
  const image = sharp(file)
  const metadata = await image.metadata()
  const { width, height } = metadata

  return getImageSizes(width, height, sizes)
    .map(async size => {
      const { outputPath, relativePath } = getImagePath(file, inputDir, outputDir, size.width)

      await mkdirp(dirname(outputPath))
      await image
        .resize(size.width, size.height)
        .toFile(outputPath)
        .catch(err => console.error(err))

      return {
        outputPath,
        relativePath,
        width: size.width,
        height: size.height
      }
    })
    .awaitAll()
}

export const getImageMediaQueries = async (metaArr) => {
  return metaArr.map(meta => {
    console.dir({ meta })
    const { relativePath, width } = meta
    return {
      condition: `(max-width: ${width}px)`,
      value: `url(${relativePath})`
    }
  })
}

const getImageTagAttributes = async (metaArr) => {
  const srcsets = []
  const sizes = []

  metaArr.forEach(meta => {
    const { relativePath, width } = meta
    srcsets.push(`${relativePath} ${width}w`)
    sizes.push(`(max-width: ${width}px) ${width}px`)
  })

  return {
    srcset: srcsets.join(', '),
    sizes: sizes.join(', ')
  }
}

export const compileImages = async ({
  doc,
  htmlInputPath,
  htmlOutputPath,
  basePath,
  inputDirectory,
  outputDirectory,
  optimizeImages = false
}) => {
  if (!optimizeImages) return
  await AsyncArray
    .from(doc.querySelectorAll('img[src]'))
    .filter(element => {
      const src = element.getAttribute('src')
      return element?.parentElement?.tagName?.toLowerCase() !== 'picture'
        && !src.startsWith('http')
        && !src.startsWith('//')
        && !src.startsWith('data:')
    })
    .map(async element => {
      const src = element.getAttribute('src')
      const inline = src.endsWith('.svg')
      if (inline) {
        const svgPath = getResolvedPath(htmlInputPath, src)
        const svg = await read(svgPath)
        element.setAttribute('src', `data:image/svg+xml,${encodeURIComponent(svg)}`)
      } else {
        const imageInputPath = getResolvedPath(htmlInputPath, src)
        const imageMetaArr = await generateImages({
          file: imageInputPath,
          inputDir: inputDirectory,
          outputDir: outputDirectory
        })
        const { srcset, sizes } = await getImageTagAttributes(imageMetaArr)
        element.setAttribute('srcset', srcset)
        if (!element.hasAttribute('sizes')) {
          element.setAttribute('sizes', sizes)
        }
      }
    })
    .awaitAll()
}
