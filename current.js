const process = require('node:process');
const handleFile = require('./handleFile.js');

const exit = (error) => {
  process.stdout.write(`Error: ${error}.`);
  process.exit(1);
};

const args = process.argv;
if (args.length < 3 || args.length > 5) exit('Incorrect number of options');

const ALLOWED_OPTIONS = ['--ecr', '--aws', '--id', '--uid'];
for (let idx = 2; idx < args.length; idx++) {
  if (!ALLOWED_OPTIONS.includes(args[idx])) exit('Invalid option applied');
}

const ecrFlag = args.includes('--ecr');
const awsFlag = args.includes('--aws');
const idFlag = args.includes('--id');
const updateIdFlag = args.includes('--uid');

if (idFlag && updateIdFlag) {
  exit('Providing id and update id options is not allowed');
}

(async function main() {
  const output = [];
  switch (process.env.CONFIG_ENV) {
    case 'dev':
      if (ecrFlag) output.push('ECR_ID=852507783007');
      if (awsFlag && !process.env.PIPELINE)
        output.push('AWS_PROFILE=iDPCC-FluHubAdmin-DEV');
      break;
    case 'stage':
      if (ecrFlag) output.push('ECR_ID=005925987320');
      if (awsFlag && !process.env.PIPELINE)
        output.push('AWS_PROFILE=iDPCC-FluHubAdmin-STAG');
      break;
    case 'prod':
      if (ecrFlag) output.push('ECR_ID=643366142385');
      if (awsFlag && !process.env.PIPELINE)
        output.push('AWS_PROFILE=iDPCC-FluHubAdmin-PROD');
    default:
      exit('$CONFIG_ENV does not equal dev, stage, or prod');
  }
  if (idFlag || updateIdFlag) {
    try {
      const id = await handleFile(updateIdFlag);
      output.push(id);
    } catch (err) {
      exit(err.message);
    }
  }
  process.stdout.write(output.join(' '));
})();
