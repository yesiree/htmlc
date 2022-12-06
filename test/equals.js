import fs from 'fs/promises'

const [actual, expected] =
  await Promise.all(
    process.argv
      .slice(2, 4)
      .map(x => fs.readFile(x))
  )

if (actual.equals(expected)) {
  console.log('Passed.')
} else {
  console.log(`Failed:\n\nActual:\n=========\n${actual}\n=========\n\nExpected:\n=========\n${expected}\n=========\n`)
  process.exit(1)
}
