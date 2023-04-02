const process = require('node:process');
const fs = require('node:fs/promises');

const toml = require('toml');
const json2toml = require('./json2Toml.js');

async function main(update) {
  const file = await fs.readFile('./samconfig.toml');
  const data = toml.parse(file);

  const target = process.env.CONFIG_ENV;

  if (!data[target]) {
    throw Error('Table header in samconfig should match $CONFIG_ENV');
  }

  const {
    deploy: {
      parameters: { parameter_overrides },
    },
  } = data[target];

  for (let idx = 0; idx < parameter_overrides.length; idx++) {
    const param = parameter_overrides[idx];
    if (param.includes('BuildId')) {
      let id = Number(param.slice(param.indexOf('=') + 1));

      if (update) {
        parameter_overrides[idx] = `BuildId=${++id}`;
        const backToToml = json2toml(data, { newlineAfterSection: true });
        await fs.writeFile('./samconfig.toml', backToToml);
      }

      return id;
    }
  }
}

module.exports = main;
