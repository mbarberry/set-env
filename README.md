This utility runs the provided command after setting environment variables based on $CONFIG_ENV and passed options.

$CONFIG_ENV can be one of dev, stag, or prod.

- The -a option sets AWS_PROFILE
- The -e option sets ECR_ID
- The -i option sets BUILD_ID based on the current value (more on that in a minute)
- The -u option sets BUILD_ID after incrementing it by one and writing the new number back to the file

Note: -i and -u options cannot be passed together.

ECR_ID and BUILD_ID values are retrieved from samconfig.toml parameter_overrides under the table header matching the $CONFIG_ENV.deploy.parameters. For example, dev.deploy.parameters.

ECR_ID comes from the ID at the beginning of the ImageRepo value. BUILD_ID comes from BuildID.

AWS profiles are retrieved from a file called './profiles.js'. This file should default export an object with dev, stag, and prod keys and the corresponding values.

If a PIPELINE environment variable is detected, AWS_PROFILE will not be set even if the option is passed.

Note: The program looks for samconfig.toml and profile.js files in the current working directory of the node process.

To use as a package run `npm pack` and `npm install` the tarball in a project.
