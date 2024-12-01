import minimist from 'minimist'

export const params = {
  inputDirectory: {
    type: 'string',
    name: 'input-dir',
    alias: 'src',
    fallback: 'src/',
    description: 'Source directory'
  },
  sourceHtmlExtension: {
    type: 'string',
    name: 'html-extension',
    fallback: '.html',
    description: 'Extension for source html files'
  },
  preprocessHtml: {
    type: 'boolean',
    name: 'preprocess',
    alias: 'p',
    fallback: true,
    description: 'Preprocess html with a template engine'
  },
  outputDirectory: {
    type: 'string',
    name: 'output-dir',
    alias: 'out',
    fallback: 'out/',
    description: 'Directory where generated files are saved'
  },
  addTrailingIndex: {
    type: 'boolean',
    name: 'trailing-index',
    alias: 't',
    fallback: true,
    description: 'Add trailing index file, e.g. about.html -> about/index.html'
  },
  compressOutput: {
    type: 'boolean',
    name: 'compress',
    alias: 'c',
    fallback: true,
    description: 'Compress output'
  },
  outputES6Modules: {
    type: 'boolean',
    name: 'es6-modules',
    alias: 'e',
    fallback: true,
    description: 'Make output js files es6 modules'
  },
  optimizeImages: {
    type: 'boolean',
    name: 'optimize-images',
    alias: 'i',
    fallback: true,
    description: 'Optimize images (resize raster, inline svg)'
  },
  filesToCopy: {
    type: 'string',
    name: 'copy',
    fallback: '**',
    description: 'Copy other files to distribution directory'
  },
  includeJsonData: {
    type: 'boolean',
    name: 'data',
    fallback: true,
    description: 'Include json data files to be used as the context for html templates'
  },
  watchChanges: {
    type: 'boolean',
    name: 'watch',
    alias: 'w',
    fallback: false,
    description: 'Watch input directory for changes and keep updating output'
  },
  suppressConsoleOutput: {
    type: 'boolean',
    name: 'quiet',
    alias: 'q',
    fallback: false,
    description: 'Suppress console output'
  },
  showVersion: {
    type: 'boolean',
    name: 'version',
    alias: 'v',
    fallback: false,
    description: 'Show version number'
  },
  showHelp: {
    type: 'boolean',
    name: 'help',
    alias: 'h',
    fallback: false,
    description: 'Show this help message'
  },
}

const convertParams = (params) => Object
  .values(params)
  .reduce((acc, { type, name, alias, fallback }) => {
    acc[type].push(name)
    acc.default[name] = fallback
    if (alias) acc.alias[name] = alias
    return acc
  }, {
    string: [],
    boolean: [],
    default: {},
    alias: {}
  })

export const getParams = () => {
  const minimistResult = minimist(
    process.argv.slice(2),
    convertParams(params)
  )
  return Object
    .entries(params)
    .reduce((acc, [key, { name }]) => {
      acc[key] = minimistResult[name]
      return acc
    }, {})
}
