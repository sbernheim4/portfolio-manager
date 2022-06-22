export const getEnvVar = (envVarName: string) => {

	const envVar = process.env[envVarName];
	if (envVar !== undefined) {
		return envVar;
	} else {
		const msg = 'Tried to retrieve environment variable ' +
			envVarName +
			' but no value was set.\nTry running \n`source app/env.sh`\n or updating it to include this value'
		throw new Error(msg);
	}
};
