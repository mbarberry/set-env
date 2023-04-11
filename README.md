This utility runs the provided command after setting environment variables based on $CONFIG_ENV and passed options.

$CONFIG_ENV can be one of dev, stag, or prod.

The -a option sets AWS_PROFILE
The -e option sets ECR_ID
The -i option sets BUILD_ID based on the current value (more on that in a minute)
The -u option sets BUILD_ID after incrementing it by one and writing the new number back to the file

ECR_ID and BUILD_ID values are retrieved from samconfig.toml under the table header matching the $CONFIG_ENV.deploy.parameters. For example, dev.deploy.parameters.
Note: The program looks for samconfig.toml in the directory where the command is invoked. Not where this program file is located. Using npm --prefix sets the invoking location to that prefix.
ECR_ID comes from the ID at the beginning of the ImageRepo value.
BUILD_ID comes from BuildID.

AWS profiles are retrieved from a file called './profiles.js' in the same directory as the program script. This file should export an object with dev, stag, and prod keys and the corresponding values.

If a PIPELINE environment variable is detected, AWS_PROFILE will not be set even if the option is passed
