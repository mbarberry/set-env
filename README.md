## Commands:

- dockerLogin
- dockerBuild
- dockerPush
- samBuild
- samDeploy

# Options:

--config-file can be provided as a relative path. The default is ./config.js

## Config

- It's default export should be an object with the keys: dev, stage and prod.

- Each of the values should also be objects with the keys: awsRegion, awsProfile, ecrRepo, ecrId.

- Samconfig.toml be located at the root of the directory where the command is run and have the table headers: dev, stage, and prod.

- Build ids should be located in parameter overrides and have the key "BuildId".

- Commands should be run with the CONFIG_ENV environment variable set to dev, stage, or prod.

**Example config file:**

    // config.js

    const config = {
      dev: {
        awsRegion: 'us-east-1',
        awsProfile: 'my-profile-dev',
        ecrId: '09809809809',
        ecrRepo: 'my-awsome-project',
      },
      stage: {
        awsRegion: 'us-east-1',
        awsProfile: 'my-profile-dev',
        ecrId: '545454545',
        ecrRepo: 'my-awsome-project',
      },
      prod: {
        awsRegion: 'us-east-1',
        awsProfile: 'my-profile-dev',
        ecrId: '8888888888',
        ecrRepo: 'my-awsome-project',
      },
    };

    module.exports = config;

**Example samconfig:**

    // samconfig.toml

    version = 1.1

    [dev.deploy.parameters]
    profile = "srirammv"
    debug = true
    skip_pull_image = true
    use_container = true
    parameter_overrides = ["name=mouse","BuildId=11","color=gray"]

    [stage.deploy.parameters]
    profile = "srirammv"
    region = "us-east-1"
    s3_bucket = "sam-bucket"
    output_template_file = "packaged.yaml"
    parameter_overrides = ["name=bowser","BuildId=6","color=grayandwhite"]

    [prod.deploy.parameters]
    stack_name = "using_config_file"
    capabilities = "CAPABILITY_IAM"
    region = "us-east-1"
    profile = "srirammv"
    parameter_overrides = ["name=fido","BuildId=14","color=orange"]

## Usage

Build docker for dev: CONFIG_ENV=dev set-env dockerBuild

Build docker for staging: CONFIG_ENV=stage set-env dockerBuild

Perform all dev docker tasks: CONFIG_ENV=dev npm run docker. Where docker = "docker": "set-env dockerLogin && set-env dockerBuild && set-env dockerPush"

Perform all stage docker tasks: CONFIG_ENV=stage npm run docker.

SAM build for prod: CONFIG_ENV=prod set-env samBuild
