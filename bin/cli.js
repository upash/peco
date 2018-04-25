#!/usr/bin/env node
if (parseInt(process.versions.node, 10) < 8) {
  const chalk = require('chalk')
  console.error(
    chalk.red(
      `Peco requires Node.js version >= 8, please upgrade!\nCheck out ${chalk.underline('https://nodejs.org')}`
    )
  )
  process.exit(1)
}

const cac = require('cac').default

const cli = cac()

cli.command('dev', 'Develop website locally', (input, flags) => {
  const options = {
    ...flags,
    baseDir: input[0]
  }
  const app = require('../lib')(options)

  return app.dev()
})

cli.command('build', 'Build website to static HTML files', (input, flags) => {
  const options = {
    ...flags,
    baseDir: input[0]
  }
  const app = require('../lib')(options)

  return app.build()
})

cli.parse()
