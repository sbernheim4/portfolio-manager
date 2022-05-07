import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
	basePath: PlaidEnvironments[process.env.PLAID_ENV as string],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
			'PLAID-SECRET': process.env.PLAID_SECRET
		},
	},
});

export const client = new PlaidApi(configuration);
