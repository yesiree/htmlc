import { basename, join } from 'path'
// import * as terser from 'terser'
import chokidar from 'chokidar'
import chalk from 'chalk'
import getFilenamesFromGlob from 'fast-glob'
// import mime from 'mime-types'
import { createLogger } from './logging.js'
import { getPkgVersion, copyFiles, readJson } from './utils.js'
import { compileHtml } from './compile-html.js'

const types = {
  'MOD': chalk.magenta('MOD'),
  'ADD': chalk.green('ADD'),
  'DEL': chalk.red('DEL'),
  'RDY': chalk.blue('READY'),
}

const styles = {
  path: chalk.blueBright,
  success: chalk.greenBright
}

const dataFileExtension = '.data.json'
const getDataKey = path => basename(path, dataFileExtension)

/*

    inputDirectory
    sourceHtmlExtension
    preprocessHtml
    outputDirectory
    addTrailingIndex
    compressOutput
    outputES6Modules
    optimizeImages
    filesToCopy
    includeJsonData
    watchChanges
    suppressConsoleOutput
    showVersion
    showHelp

*/

export const htmlc = async ({
  inputDirectory = 'src/',
  sourceHtmlExtension = '.html',
  preprocessHtml = false,
  outputDirectory = 'dest/',
  addTrailingIndex = false,
  compressOutput = true,
  outputES6Modules = true,
  optimizeImages = false,
  filesToCopy = false,
  includeJsonData = false,
  watchChanges = false,
  suppressConsoleOutput = true
} = {}) => {
  const version = await getPkgVersion()
  const logger = createLogger({ quiet: suppressConsoleOutput })
  const logCliInfo = () => logger.info(`htmlc v${version}`)
  const logUpdate = (type, path) => logger.info(`${types[type]} ${styles.path(path)}`)
  const logCompiling = (path) => logger.info(`  Compiling ${styles.path(path)}...`)
  const logWriting = (path) => logger.info(`    Writing ${styles.path(path)}...`)
  const logCompletion = (compiledCount, copiedCount) => {
    const compiledPlural = compiledCount === 1 ? '' : 's'
    const copiedPlural = copiedCount === 1 ? '' : 's'
    const copiedMessage = filesToCopy ? `, ${copiedCount} file${copiedPlural} copied.` : '.'
    const message = `   ${styles.success('Finished')} ${compiledCount} file${compiledPlural} compiled${copiedMessage}.`
    logger.info('')
    logger.info(message)
  }

  const opts = {
    inputDirectory,
    sourceHtmlExtension,
    preprocessHtml,
    outputDirectory,
    compressOutput,
    outputES6Modules,
    addTrailingIndex,
    optimizeImages,
    filesToCopy,
    includeJsonData,
  }

  const data = {}
  const htmlRegistry = []
  const initial = []
  let isReady = false
  if (watchChanges) {
    const remove = async (type, path) => {
      if (path.endsWith(sourceHtmlExtension)) {
        const index = htmlRegistry.indexOf(path)
        if (index > -1) htmlRegistry.splice(index, 1)
      }
      if (includeJsonData && path.endsWith(dataFileExtension)) {
        delete data[getDataKey(path)]
      }
      logUpdate(type, path)
    }

    const update = async (type, path = '') => {
      if (includeJsonData && path.endsWith(dataFileExtension)) {
        data[getDataKey(path)] = await readJson(path)
      }

      await Promise.all(
        htmlRegistry.map(x => compileHtml(
          x,
          includeJsonData
            ? { ...opts, data }
            : opts
        ))
      )

      if (type === 'RDY') {
        isReady = true
        await Promise.all(initial)
      }
      logUpdate(type, path)
    }

    const register = async (type, path) => {
      if (path.endsWith(sourceHtmlExtension)) {
        htmlRegistry.push(path)
        const promise = compileHtml(
          path,
          includeJsonData ? { ...opts, data } : opts
        )
        if (!isReady) initial.push(promise)
        await promise
      }
      if (includeJsonData && path.endsWith('.json')) {
        data[getDataKey(path)] = await readJson(path)
      }
      logUpdate(type, path)
    }

    return chokidar.watch(inputDirectory)
      .on('add', register.bind(null, 'ADD'))
      .on('change', update.bind(null, 'MOD'))
      .on('unlink', remove.bind(null, 'DEL'))
      .on('ready', update.bind(null, 'RDY'))

  } else {
    logCliInfo()

    const files = await getFilenamesFromGlob(join(inputDirectory, '**'))
    const promises = [
      Promise.all([
        ...files
          .filter(x => x.endsWith(dataFileExtension))
          .map(async dataFile => {
            logCompiling(dataFile)
            data[getDataKey(dataFile)] = await readJson(dataFile)
          }),
        ...files
          .filter(x => x.endsWith(sourceHtmlExtension))
          .map(async htmlFile => {
            logCompiling(htmlFile)
            const outPath = await compileHtml(
              htmlFile,
              includeJsonData
                ? { ...opts, data }
                : opts
            )
            logWriting(outPath)
          })
      ])
    ]

    if (filesToCopy) {
      promises.push(copyFiles(inputDirectory, outputDirectory, filesToCopy))
    }

    const [
      { length: compiledCount = 0 } = {},
      { length: copiedCount = 0 } = {}
    ] = await Promise.all(promises)
    logCompletion(compiledCount, copiedCount)
  }
}
