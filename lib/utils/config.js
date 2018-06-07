const path = require('upath')
const fs = require('fs-extra')
const JoyCon = require('joycon').default

const config = new JoyCon({
  stopDir: path.dirname(process.cwd())
})

config.addLoader({
  test: /\.yml$/,
  loadSync(filepath) {
    const yaml = require('js-yaml')
    const content = fs.readFileSync(filepath, 'utf8')
    return yaml.load(content)
  },
  async load(filepath) {
    const yaml = require('js-yaml')
    const content = await fs.readFile(filepath, 'utf8')
    return yaml.load(content)
  }
})

config.addLoader({
  test: /\.toml$/,
  loadSync(filepath) {
    const toml = require('toml')
    const content = fs.readFileSync(filepath, 'utf8')
    return toml.parse(content)
  },
  async load(filepath) {
    const toml = require('toml')
    const content = await fs.readFile(filepath, 'utf8')
    return toml.parse(content)
  }
})

module.exports = config
