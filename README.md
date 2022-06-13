# htmlc
A simple tool for compiling HTML files

## API

**Example**
```javascript
import { htmlc } from '@yesiree/htmlc'

htmlc({
  src: 'src/index.html', // default: 'src/index.html'
  out: 'out/index.html, // default: 'out/index.html'
  watch: true, // default: false
  minify: true // default: false
}) // returns: Promise<chokidar.FSWatcher | void>
```

## CLI

**Install Globally:**
```
$ npm i -g @yesiree/htmlc
```

**Compile src/index.html**
```
Syntax: htmlc [-s|-src|-source src/index.html] [-o|-out|-output out/index.html] [-w|-watch] [-m|-minify]
```

**Example**
```
$ htmlc -s index.html -m
```
