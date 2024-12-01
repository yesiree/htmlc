#!/usr/bin/env node

import { htmlc } from './index.js'
import { showHelp, showVersion } from './commands.js'
import { getParams } from './params.js'

const DEBUG = ('' + process.env.DEBUG).toLowerCase() === 'true'

const main = async () => {
  const args = getParams()
  if (DEBUG) console.dir({ DEBUG, args })
  if (args.showVersion) {
    showVersion()
    return 0
  }
  if (args.showHelp) {
    showHelp()
    return 0
  }
  try {
    await htmlc(args)
  } catch (e) {
    console.error(e)
    return 1
  }
}

process.exit(await main())
