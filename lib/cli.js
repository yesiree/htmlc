#!/usr/bin/env node

import { htmlc } from './index.js'
import minimist from 'minimist'
import { getPkgVersion } from './utils.js'


const DEBUG = ('' + process.env.DEBUG).toLowerCase() === 'true'

const args = minimist(process.argv.slice(2))
const source = args.s || args.src || args.source || 'src/'
const dest = args.d || args.dist || args.destination || 'dest/'
const watch = args.w || args.watch || false
const compress = args.c || args.compress || false
const module = args.m || args.module || false
const index = args.i || args.index || false
const ext = args.e || args.ext || '.html'
const other = args.o || args.other || false
const quiet = args.q || args.quiet || false
const version = args.v || args.version || false
const help = args.h || args.help || false

const showHelp = () => {
  console.log(`
  Usage: htmlc [options]

  Options:
    -s, --src, --source       Source directory (default: src/)
    -d, --dest, --destination
                              Destination directory (default: dest/)
    -w, --watch               Watch source directory for changes (default: false)
    -c, --compress            Compress output (default: false)
    -m, --module              Generate ES6 modules (default: false)
    -i, --index               Generate index.html files (default: false)
    -e, --ext                 Extension for generated files (default: .html)
    -o, --other               Copy other files to distribution directory (glob pattern)
    -q, --quiet               Suppress console output (default: false)
    -h, --help                Show this help message
    -v, --version             Show version number
  `)
}

if (version) {
  const version = await getPkgVersion()
  console.log(`htmlc v${version}`)
  process.exit(0)
}

if (help) {
  showHelp()
  process.exit(0)
}

if (DEBUG) {
  console.dir({ DEBUG, source, dest, watch, compress, module, ext, other, quiet })
}

if (typeof source !== 'string') {
  console.log(`Source parameter must be a path to a directory. Found '${source}'.`)
  showHelp()
  process.exit(1)
}

if (typeof dest !== 'string') {
  console.log(`Destination parameter must be a path to a directory. Found '${dest}'.`)
  showHelp()
  process.exit(1)
}

htmlc({ source, dest, watch, compress, module, index, ext, other, quiet })
