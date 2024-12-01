import chalk from 'chalk'
import { params } from './params.js'

const asArray = value => Array.isArray(value) ? value : [value]
const byType = (a, b) => b.type.localeCompare(a.type)

export const showHelp = () => {
  let output = `\nUsage: htmlc [options]\n\nOptions:\n`
  const lines = Object
    .values(params)
    .toSorted(byType)
    .map(value => {
      const aliases = asArray(value.alias)
        .map(x => x.length === 1 ? `-${x}` : `--${x}`)
        .join(', ')
      const fallback = value.default === undefined ? '' : ` (default: ${value.default})`
      const description = value.description || ''
      return { aliases, fallback, description }
    })

  const maxLength = Math.max(...lines.map(x => x.aliases.length))

  lines.forEach(({ aliases, fallback, description }) => {
    const aliasText = aliases.padEnd(maxLength)
    const descriptionText = chalk.dim(description)
    const fallbackText = chalk.cyan(fallback)
    output += `  ${aliasText}  ${descriptionText}${fallbackText}\n`
  })

  console.log(output)
}


export const showVersion = async () => {
  const version = await getPkgVersion()
  console.log(`htmlc v${version}`)
}
