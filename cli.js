#!/usr/bin/env node

import { htmlc } from './index.js'
import minimist from 'minimist'


const DEBUG = ('' + process.env.DEBUG).toLowerCase() === 'true'

const args = minimist(process.argv.slice(2))
const source = args.s || args.src || args.source || 'src/'
const dist = args.d || args.dist || args.distribution || 'dist/'
const watch = args.w || args.watch || false
const compress = args.c || args.compress || false
const module = args.m || args.module || false
const ext = args.e || args.ext || '.html'
const quiet = args.q || args.quiet || false

if (DEBUG) {
  console.dir({ DEBUG, source, dist, watch, compress, module, ext })
}

htmlc({ source, dist, watch, compress, module, ext, quiet })
