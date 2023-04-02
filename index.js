const process = require('node:process');
const childProcess = require('node:child_process');
const handleFile = require('./handleFile.js');

const exit = (err) => {
  console.error(err);
  process.exit(1);
};

if (!['dev', 'stage', 'prod'].includes(process.env.CONFIG_ENV)) {
  exit('$CONFIG_ENV should equal dev, stage, or prod.');
}

const attemptImport = () => {
  try {
    const config = require('./config.js');
    return config;
  } catch (err) {
    exit('Config file is missing.');
  }
};

const validateKeys = (obj, validationArray, n) => {
  if (!Object.keys(obj).length === n) return false;
  const bool = Object.keys(obj).every((key) => validationArray.includes(key));
  return bool;
};

(async function main() {
  const mainArg = process.argv[2];

  const config = attemptImport();

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
    dockerBuild: `docker build --progress string -t ${environment.ecrId}.dkr.ecr.us-east-1.amazonaws.com/${environment.ecrRepo}:${environment.BuildId} --build-arg ConfigEnv=${process.env.CONFIG_ENV} .`,
    dockerPush: `docker push ${environment.ecrId}.dkr.ecr.us-east-1.amazonaws.com/${environment.ecrRepo}:${environment.BuildId}`,
    samBuild: `sam build --config-env=${process.env.CONFIG_ENV}`,
    samDeploy: `sam deploy --config-env=${process.env.CONFIG_ENV}`,
  };

  childProcess.spawn(`echo "${commands[mainArg]} $AWS_PROFILE"`, {
    shell: '/bin/bash',
    stdio: 'inherit',
    env: { ...process.env, AWS_PROFILE: environment.awsProfile },
  });
})();
