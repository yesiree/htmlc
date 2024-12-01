import chalk from 'chalk'

const now = () => {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = ('' + (date.getMonth() + 1)).padStart(2, '0')
  const dd = ('' + date.getDate()).padStart(2, '0')
  const hh = ('' + date.getHours()).padStart(2, '0')
  const min = ('' + date.getMinutes()).padStart(2, '0')
  const sec = ('' + date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
}

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const logTypes = {
  debug: {
    level: 0,
    color: chalk.blueBright
  },
  info: {
    level: 1,
    color: chalk.whiteBright
  },
  warn: {
    level: 2,
    color: chalk.yellowBright
  },
  error: {
    level: 3,
    color: chalk.redBright
  }
}

export const createLogger = (options) => {
  const opts = {
    name: '',
    quiet: false,
    time: true,
    level: 'info'
  }

  const configure = ({
    name = opts.name,
    quiet = opts.quiet,
    time = opts.time,
    level = opts.level,
  } = {}) => {
    if (!(level in levels)) {
      throw new Error(`Invalid log level: ${level}. Must be one of ${Object.keys(levels).join(', ')}.`)
    }

    opts.name = name || opts.name
    opts.quiet = quiet || opts.quiet
    opts.time = time || opts.time
    opts.level = level || opts.level
    opts.levelIndex = levels[opts.level],
    opts.ns = opts.name ? chalk.cyan(`[${opts.name}]`) : '',
    opts.ts = time => time ? chalk.gray(`[${now()}]`) : ''
  }

  configure(options)

  const writeOut = (message, {
    time = opts.time,
    type = 'log',
  } = {}) => {
    const color = logTypes[type].color
    const level = logTypes[type].level
    if (opts.quiet || opts.levelIndex > level || !console || !console[type]) return
    console[type](`${opts.ts(time)}${opts.ns}: ${color(message)}`)
  }

  const debug = (message, options) => writeOut(message, { type: 'debug', ...options })
  const info = (message, options) => writeOut(message, { type: 'info', ...options })
  const warn = (message, options) => writeOut(message, { type: 'warn', ...options })
  const error = (message, options) => writeOut(message, { type: 'error', ...options })

  return {
    debug,
    info,
    warn,
    error,
    configure
  }
}
