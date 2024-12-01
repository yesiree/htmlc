import fs from 'fs/promises'
import colors from 'colors'
import * as Diff from 'diff'


const [actual, expected] =
  await Promise.all(
    process.argv
      .slice(2, 4)
      .map(x => fs.readFile(x))
  )

if (actual.equals(expected)) {
  console.log('  ✅ Passed.\n')
} else {
  console.log(`  ❌ Failed.`)

  const actualStr = actual.toString()
  const expectedStr = expected.toString()
  const minLength = Math.min(actualStr.length, expectedStr.length)
  let index = 0
  while (index < minLength && actualStr[index] === expectedStr[index]) index++
  if (index > 0 && index < minLength) {
    const snip = whole => whole.slice(index - 20, index + 20)
      .split('\n')
      .map(x => `      |${x}|`)
      .join('\n')

    const actualSnippet = snip(actualStr)
    const expectedSnippet = snip(expectedStr)

      console.log(`  Diff found at index ${index}:\n\n    Actual:\n\n${actualSnippet}\n\n    Expected:\n\n${expectedSnippet}|\n`)
  }

  // const diff = Diff.diffChars(actual.toString(), expected.toString())
  // diff.forEach((part) => {
  //   const text = part.added
  //     ? colors.green(part.value)
  //     : part.removed
  //       ? colors.red(part.value)
  //       : part.value
  //   process.stderr.write(text.slice(0, 1000))
  // })

  process.exit(1)
}
