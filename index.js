#!/usr/bin/env node

'use strict';

const process = require('node:process');
const childProcess = require('node:child_process');
const fs = require('node:fs/promises');

const handleFile = require('./handleFile.js');

const args = process.argv;
const configEnv = process.env.CONFIG_ENV;

const exit = (err) => {
  console.error(err);
  process.exit(1);
};

if (!['dev', 'stag', 'prod'].includes(configEnv)) {
  exit('$CONFIG_ENV should equal dev, stag, or prod.');
}

const ALLOWED_OPTIONS = ['-a', '-e', '-i', '-u', '-v'];
let idx = 2;
while (idx < args.length && args[idx] !== '--') {
  if (!ALLOWED_OPTIONS.includes(args[idx])) exit('Invalid option applied');
  idx++;
}

if (!args.includes('--')) {
  exit(`'--' should be provided to separate options and command`);
}
const options = args.slice(2, args.indexOf('--'));
if (options.includes('-i') && options.includes('-u')) {
  exit('Id and update id options are not allowed together');
}

const shouldHandleFile =
  options.includes('-e') || options.includes('-i') || options.includes('-u');
const command = args[args.indexOf('--') + 1];
if (!command) exit('A command should be provided');

const getIdsFromSamconfig = async () => {
  try {
    const ids = await handleFile(configEnv, options.includes('-u'));
    return ids;
  } catch (err) {
    exit(err.message);
  }
};

const lookForEnvFile = async () => {
  const dir = await fs.readdir('.');
  if (!dir.includes(`.env.${process.env.CONFIG_ENV}`)) {
    exit('A .env.$CONFIG_ENV file should exist');
  }
};

(async function main() {
  let ecrId, buildId;

  if (options.includes('-v')) {
    await lookForEnvFile();
  }

  if (shouldHandleFile) {
    const ids = await getIdsFromSamconfig();
    ecrId = ids.ecrId;
    buildId = ids.buildId;
  }

  const environment = { ['CONFIG_ENV']: configEnv };

  if (options.includes('-a') && !process.env.PIPELINE) {
    try {
      environment.AWS_PROFILE = require('./profiles.js')[configEnv];
    } catch (err) {
      exit(
        'Double check a profiles.js file is in this directory and contains a $CONFIG_ENV value'
      );
    }
  }
  if (options.includes('-e')) {
    environment.ECR_ID = ecrId;
  }
  if (options.includes('-i') || options.includes('-u')) {
    environment.BUILD_ID = buildId;
  }

  childProcess.spawn(command, {
    shell: '/bin/bash',
    stdio: 'inherit',
    env: { ...environment },
  });
})();
