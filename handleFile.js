'use strict';

const fs = require('node:fs/promises');

const toml = require('toml');
const json2toml = require('./json2Toml.js');

async function main(configEnv, update) {
  const file = await fs.readFile('./samconfig.toml');
  const data = toml.parse(file);

  (function checkConfigKeys(obj, arr) {
    if (arr.length === 0) return;
    const curr = arr.shift();
    if (!obj[curr]) {
      throw Error(
        'Samconfig should have [$CONFIG_ENV.deploy.parameters] table and parameter_overrides key'
      );
    }
    if (curr === 'parameter_overrides') {
      const overrides = obj[curr].join('');
      if (
        !overrides.includes('BuildID=') ||
        !overrides.includes('ImageRepo=')
      ) {
        throw Error(
          'Parameter overrides should have BuildID and ImageRepo values'
        );
      }
    }
    return checkConfigKeys(obj[curr], arr);
  })(data, [configEnv, 'deploy', 'parameters', 'parameter_overrides']);

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
