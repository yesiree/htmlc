#!/usr/bin/env node

import { htmlc } from './index.js'
import minimist from 'minimist'
import { getPkgVersion } from './utils.js'


const DEBUG = ('' + process.env.DEBUG).toLowerCase() === 'true'

const args = minimist(process.argv.slice(2))
const source = args.s || args.src || args.source || 'src/'
const dist = args.d || args.dist || args.distribution || 'dist/'
const watch = args.w || args.watch || false
const compress = args.c || args.compress || false
const module = args.m || args.module || false
const ext = args.e || args.ext || '.html'
const quiet = args.q || args.quiet || false

if (args._[0] === 'v' || args._[0] === 'version') {
  const version = await getPkgVersion()
  console.log(`htmlc v${version}`)
  process.exit(0)
}

if (DEBUG) {
  console.dir({ DEBUG, source, dist, watch, compress, module, ext })
}

if (typeof source !== 'string') {
  console.log(`Source parameter must be a path to a directory. Found '${source}'.`)
  process.exit(1)
}

if (typeof dist !== 'string') {
  console.log(`Dist parameter must be a path to a directory. Found '${dist}'.`)
  process.exit(1)
}

htmlc({ source, dist, watch, compress, module, ext, quiet })
