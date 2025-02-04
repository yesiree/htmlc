
const htmlTests = [
  {
    htmlInputPath: './src/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: false,
    expected: 'index.html',
  },
  {
    htmlInputPath: './src/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: true,
    expected: 'index.html',
  },
  {
    htmlInputPath: './src/about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: false,
    expected: 'about/index.html',
  },
  {
    htmlInputPath: './src/about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: true,
    expected: 'about/index.html',
  },
  {
    htmlInputPath: './src/about.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: false,
    expected: 'about.html',
  },
  {
    htmlInputPath: './src/about.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    addTrailingIndex: true,
    expected: 'about/index.html',
  },
]

const assetUriTests = [
  {
    assetPath: 'assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    expected: 'about/assets/img/logo.png',
  },
  {
    assetPath: '/assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    expected: '/assets/img/logo.png',
  },
  {
    assetPath: '../assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    expected: 'assets/img/logo.png',
  },
  {
    assetPath: './src/assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    expected: 'about/src/assets/img/logo.png',
  }
]

const assetPathTests = [
  {
    assetPath: 'assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    expected: 'about/assets/img/logo.png',
  },
  {
    assetPath: '/assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    expected: 'assets/img/logo.png',
  },
  {
    assetPath: '../assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    expected: 'assets/img/logo.png',
  },
  {
    assetPath: './src/assets/img/logo.png',
    htmlOutputPath: 'about/index.html',
    inputDirectory: './src',
    outputDirectory: './dst',
    expected: 'about/src/assets/img/logo.png',
  },
]

const htmlAggregateResults = htmlTests.map(({ htmlInputPath, inputDirectory, outputDirectory, addTrailingIndex, expected }, index) => {
  const actual = getHtmlPath({ htmlInputPath, inputDirectory, outputDirectory, addTrailingIndex })
  const passed = actual === expected
  if (!passed) {
    console.log('\nHtml Test[' + index + '] Failed ❌')
    console.log('  params:\n    - htmlInputPath:', htmlInputPath, '\n    - inputDirectory:', inputDirectory, '\n    - outputDirectory:', outputDirectory, '\n    - addTrailingIndex:', addTrailingIndex)
    console.log('  expected: ', expected)
    console.log('    actual: ', actual)
    console.log('')
  }
  return { index, passed }
})

var htmlPassedCount = htmlAggregateResults.filter(({ passed }) => passed).length
var htmlFailedCount = htmlAggregateResults.filter(({ passed }) => !passed).length
var htmlTotalCount = htmlAggregateResults.length
console.log('Html Results: ', htmlPassedCount, 'Passed ✅; ', htmlFailedCount, 'Failed ❌; ', htmlTotalCount, 'Total\n')


const assetUriAggregateResults = assetUriTests.map(({ assetPath, htmlOutputPath, expected }, index) => {
  const actual = getAssetUri({ assetPath, htmlOutputPath })
  const passed = actual === expected
  if (!passed) {
    console.log('\nAsset URI Test[' + index + '] Failed ❌')
    console.log('  params:\n    - assetPath:', assetPath, '\n    - htmlOutputPath:', htmlOutputPath)
    console.log('  expected: ', expected)
    console.log('    actual: ', actual)
    console.log('')
  }
  return { index, passed }
})

var assetUriPassedCount = assetUriAggregateResults.filter(({ passed }) => passed).length
var assetUriFailedCount = assetUriAggregateResults.filter(({ passed }) => !passed).length
var assetUriTotalCount = assetUriAggregateResults.length
console.log('Asset URI Results:', assetUriPassedCount, 'Passed ✅', assetUriFailedCount, 'Failed ❌', assetUriTotalCount, 'Total\n')


const assetPathAggregateResults = assetPathTests.map(({ assetPath, htmlOutputPath, inputDirectory, outputDirectory, expected }, index) => {
  const actual = getAssetPath({ assetPath, htmlOutputPath, inputDirectory, outputDirectory })
  const passed = actual === expected
  if (!passed) {
    console.log('\nAsset Test[' + index + '] Failed ❌')
    console.log('  params:\n    - assetPath:', assetPath, '\n    - htmlOutputPath:', htmlOutputPath, '\n    - inputDirectory:', inputDirectory, '\n    - outputDirectory:', outputDirectory)
    console.log('  expected: ', expected)
    console.log('    actual: ', actual)
    console.log('  ' + (passed ? 'Passed ✅' : 'Failed ❌'))
    console.log('')
  }
  return { index, passed }
})

var assetPassedCount = assetPathAggregateResults.filter(({ passed }) => passed).length
var assetFailedCount = assetPathAggregateResults.filter(({ passed }) => !passed).length
var assetTotalCount = assetPathAggregateResults.length
console.log('Asset Results:', assetPassedCount, 'Passed ✅', assetFailedCount, 'Failed ❌', assetTotalCount, 'Total\n')
