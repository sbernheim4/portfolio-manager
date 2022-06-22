import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getEnvVar } from "./getEnvVar";

const configuration = new Configuration({
	basePath: PlaidEnvironments[getEnvVar('PLAID_ENV')],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': getEnvVar('PLAID_CLIENT_ID'),
			'PLAID-SECRET': getEnvVar('PLAID_SECRET')
		},
	},
});

export const client = new PlaidApi(configuration);
