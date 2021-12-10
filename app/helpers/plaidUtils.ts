import { Configuration, Holding, LinkTokenCreateRequest, PlaidApi, PlaidEnvironments } from "plaid";
import { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV } from "../../env";
import { getTokenMap, getEntry } from "./localTokenStorage";

const configuration = new Configuration({
	basePath: PlaidEnvironments[PLAID_ENV],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
			'PLAID-SECRET': PLAID_SECRET
		},
	},
});

const getClient = () => {
	const client = new PlaidApi(configuration);
	return client;
}

export const getAccessToken = async (public_token: string) => {

	try {
		const client = getClient();

		const request = { public_token };
		const accessTokenRequest = await client.itemPublicTokenExchange(request);
		const accessTokenData = accessTokenRequest.data

		return accessTokenData;

	} catch (err) {

		return {
			error: 'error exchanging a public token for an access token'
		}

	}

};

const isFilled = <T extends {}>(v: PromiseSettledResult<T>): v is PromiseFulfilledResult<T> => v.status === 'fulfilled';

export const getInvestmentHoldings = async (): Promise<Holding[]> => {

	const keys = getTokenMap().keys();

	console.log("in getInvestmentHoldings");
	console.log(getTokenMap());

	const accessTokens = Array.from(keys)
		.flatMap(itemId => getEntry(itemId as string) ?? [])
		.filter(Boolean);

	console.log({ accessTokens });

	try {

		const client = getClient();
		const holdingsDataPromises = accessTokens.map(accessToken => {

			return client.investmentsHoldingsGet({ access_token: accessToken });

		});

		const holdingsData = await Promise.allSettled(holdingsDataPromises)
		const resolvedHoldingsData = holdingsData.filter(isFilled).flatMap(x => x.value.data.holdings);

		return resolvedHoldingsData;


	} catch (err) {

		return [];

	}

};

export const createLinkToken = async (request: LinkTokenCreateRequest) => {

	try {

		const client = getClient();

		const response = await client.linkTokenCreate(request);

		const linkToken = response.data.link_token;

		return linkToken;

	} catch (err) {

		return "";

	}
};
