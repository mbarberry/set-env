'use strict';

const fs = require('node:fs/promises');

const toml = require('toml');
const json2toml = require('./json2Toml.js');

async function main(configEnv, update) {
  const file = await fs.readFile('./samconfig.toml');
  const data = toml.parse(file);

  if (!data[configEnv]) {
    throw Error('Samconfig should have table headers that match $CONFIG_ENVs');
  }

  const {
    deploy: {
      parameters: { parameter_overrides },
    },
  } = data[configEnv];

  let buildId, ecrId;

  for (let idx = 0; idx < parameter_overrides.length; idx++) {
    const param = parameter_overrides[idx];
    if (param.includes('BuildID')) {
      buildId = Number(param.slice(param.indexOf('=') + 1));
      if (update) {
        parameter_overrides[idx] = `BuildID=${++buildId}`;
        const backToToml = json2toml(data, { newlineAfterSection: true });
        await fs.writeFile('./samconfig.toml', backToToml);
      }
    } else if (param.includes('ImageRepo')) {
      ecrId = param.slice(param.indexOf('=') + 1, param.indexOf('.'));
    }
  }

  return { buildId, ecrId };
}

module.exports = main;
