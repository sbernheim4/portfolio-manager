import {  CountryCode, Holding, LinkTokenCreateRequest, Security } from "plaid";
import { isFilled } from "~/helpers/isFilled";
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

export const createPlaidLinkToken = async (request: LinkTokenCreateRequest) => {

	try {

		const response = await client.linkTokenCreate(request);
		const linkToken = response.data.link_token;

		return linkToken;

	} catch (err) {

		return "";

	}
};

export const getInvestmentHoldings = async (): Promise<{holdings: Holding[]; securities: Security[]}>=> {

	const accessTokens = await retrieveStoredAccessTokens();

	try {

		const holdingsDataPromises = accessTokens.map(accessToken => {

			return client.investmentsHoldingsGet({ access_token: accessToken });

		});

		const holdingsData = await Promise.allSettled(holdingsDataPromises)
		const resolvedHoldingsData = holdingsData.filter(isFilled).map(x => x.value.data);

		const holdings = resolvedHoldingsData.flatMap(x => x.holdings);
		const securities = resolvedHoldingsData.flatMap(x => x.securities)

		return {
			holdings,
			securities
		};


	} catch (err) {

		console.log("investmentHoldings: ", err);

		return {
			holdings: [],
			securities: []
		};

	}

};

export const getPlaidLinkedAccounts = async () => {

	try {

		const accessTokens = await retrieveStoredAccessTokens();

		const accountInformationPromises = accessTokens.map(token => {
			return client.accountsGet({ access_token: token });
		})

		const accountInformation = await Promise.allSettled(accountInformationPromises);
		const account = accountInformation.filter(isFilled).flatMap(x => x.value.data.accounts)

		return account;

	} catch (err) {

		console.log("getAccounts: ", err);

		return [];
	}


};


export const getPlaidAccountBalances = async () => {

	try {

		const accessTokens = await retrieveStoredAccessTokens();

		const balancesPromises = accessTokens.map(token => {
			return client.accountsBalanceGet({ access_token: token });
		});

		const balances = await Promise.allSettled(balancesPromises);
		const resolvedBalancesData = balances.filter(isFilled).flatMap(x => x.value.data.accounts)

		return resolvedBalancesData;

	} catch (err) {

		console.log("getAccountsBalance: ", err);

		return [];

	}

};

export const getPlaidLinkedInstitutions = async () => {

	try {

		const accessTokens = await retrieveStoredAccessTokens();

		const itemPromises = accessTokens.map(token => {
			return client.itemGet({ access_token: token });
		});

		const items = await Promise.allSettled(itemPromises);
		const resolvedItems = items.filter(isFilled).map(x => x.value.data.item)

		const requests = resolvedItems
			.filter(item => !!item.institution_id)
			.map(item => {

				return {
					institution_id: item.institution_id as string,
					country_codes: ['US'] as CountryCode[],
				};

			});

		const institutionRequests = requests.map(req => client.institutionsGetById(req));
		const institutions = await Promise.allSettled(institutionRequests);
		const resolvedInstutions = institutions.filter(isFilled).map(x => x.value.data.institution);

		return resolvedInstutions;

	} catch (err) {

		return []

	}

};

export const unlinkPlaidItem = async (accessToken: string) => {
	// TODO: Determine how to relate an institutionId to an access token

	// const accessTokens = await retrieveStoredAccessTokens();

	// try {
	//
	// 	const response = await client.itemRemove({ access_token: token });
	//
	// } catch (error) {
	//
	// 	 handle error
	//
	// }

	// The Item was removed, access_token is now invalid

};
