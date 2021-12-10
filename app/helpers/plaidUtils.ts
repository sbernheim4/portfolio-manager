import { Holding, LinkTokenCreateRequest } from "plaid";
import { retrieveStoredAccessTokens } from "./db";
import { client } from "./plaidClient";

export const exchangePublicTokenForAccessToken = async (public_token: string) => {

	try {

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

    const accessTokens = await retrieveStoredAccessTokens();

	try {

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

export const createPlaidLinkToken = async (request: LinkTokenCreateRequest) => {

	try {

		const response = await client.linkTokenCreate(request);
		const linkToken = response.data.link_token;

		return linkToken;

	} catch (err) {

		return "";

	}
};
