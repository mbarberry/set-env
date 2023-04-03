#!/usr/bin/env node

const process = require('node:process');
const path = require('node:path');
const fs = require('node:fs/promises');
const childProcess = require('node:child_process');
const handleFile = require('./handleFile.js');

const exit = (err) => {
  console.error(err);
  process.exit(1);
};

if (!['dev', 'stage', 'prod'].includes(process.env.CONFIG_ENV)) {
  exit('$CONFIG_ENV should equal dev, stage, or prod.');
}

const attemptImport = async () => {
  try {
    let configPath = '/config.js';

    if (process.argv.includes('--config-file')) {
      const providedPath =
        process.argv[process.argv.indexOf('--config-file') + 1];

      if (!providedPath) {
        exit('Path is required with the --config-file option.');
      }

      const dir = await fs.readdir(
        path.join(
          process.cwd(),
          providedPath.slice(0, providedPath.lastIndexOf('/'))
        )
      );
      const file = providedPath.slice(providedPath.lastIndexOf('/') + 1);
      if (!dir.includes(file)) exit('Invalid config file path.');

      configPath = providedPath;
    }
    const config = require(path.join(process.cwd(), configPath));
    return config;
  } catch (err) {
    exit(err);
  }
};

const validateKeys = (obj, validationArray, n) => {
  if (!Object.keys(obj).length === n) return false;
  const bool = Object.keys(obj).every((key) => validationArray.includes(key));
  return bool;
};

(async function main() {
  const mainArg = process.argv[2];
  if (
    ![
      'dockerLogin',
      'dockerBuild',
      'dockerPush',
      'samBuild',
      'samDeploy',
    ].includes(mainArg)
  ) {
    exit('Invalid command provided.');
  }

  let additionalArgs;
  if (process.argv.includes('--add-options')) {
    additionalArgs = process.argv.slice(
      process.argv.indexOf('--add-options') + 1
    );
  }

  const config = await attemptImport();

  const validateConfig = (() => {
    const allEnvsCorrect = validateKeys(config, ['dev', 'stage', 'prod'], 3);
    let allPropsCorrect = true;
    for (const target of Object.values(config)) {
      if (
        !validateKeys(
          target,
          ['awsRegion', 'awsProfile', 'ecrId', 'ecrRepo'],
          4
        )
      )
        allPropsCorrect = false;
    }
    if (!allEnvsCorrect || !allPropsCorrect)
      exit(`Config file doesn't match the required format.`);
  })();

  const environment = { ...config[process.env.CONFIG_ENV] };

  if (mainArg === 'dockerBuild' || mainArg === 'dockerPush') {
    try {
      const id = await handleFile(mainArg === 'dockerBuild');
      environment.BuildId = id;
    } catch (err) {
      exit(err.message);
    }
  }

  const commands = {
    dockerLogin: `aws ecr get-login-password --region ${environment.awsRegion} | docker login --username AWS --password-stdin ${environment.ecrId}.dkr.ecr.${environment.awsRegion}.amazonaws.com`,

    dockerBuild: `docker build -t ${environment.ecrId}.dkr.ecr.${
      environment.awsRegion
    }.amazonaws.com/${environment.ecrRepo}:${
      environment.BuildId
    } ${additionalArgs.join(' ')} .`,

    dockerBuildArg: `docker build -t ${environment.ecrId}.dkr.ecr.${environment.awsRegion}.amazonaws.com/${environment.ecrRepo}:${environment.BuildId} --build-arg ConfigEnv=${process.env.CONFIG_ENV} .`,

    dockerPush: `docker push ${environment.ecrId}.dkr.ecr.${environment.awsRegion}.amazonaws.com/${environment.ecrRepo}:${environment.BuildId}`,

    samBuild: `sam build --config-env=${process.env.CONFIG_ENV}`,

    samDeploy: `sam deploy --config-env=${process.env.CONFIG_ENV}`,
  };

  childProcess.spawn(commands[mainArg], {
    shell: '/bin/bash',
    stdio: 'inherit',
    env: { ...process.env, AWS_PROFILE: environment.awsProfile },
  });
})();
