import {  AccountBase, CountryCode, Holding, InstitutionsGetByIdResponse, LinkTokenCreateRequest, Security } from "plaid";
import type { AxiosResponse } from 'axios';
import { isFilled } from "~/helpers/isFilled";
import { retrieveItemIdToAccessTokenMap, retrieveStoredAccessTokens } from "./db";
import { client } from "./plaidClient";

export const exchangePublicTokenForAccessToken = async (public_token: string) => {

	try {

		const request = { public_token };
		const accessTokenRequest = await client.itemPublicTokenExchange(request);
		const accessTokenData = accessTokenRequest.data

		return accessTokenData;

	} catch (err) {

		console.error('error exchanging a public token for an access token');

		throw err;

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

export const filterForInvestmentAccounts = (accounts: Array<AccountBase>) => {
	const validInvestmentAccounts = ["investment", "brokerage"];

	return accounts.filter(account => validInvestmentAccounts.includes(account.type));

};

export const filterForNonInvestmentAccounts = (accounts: Array<AccountBase>) => {
	const validInvestmentAccounts = ["investment", "brokerage"];

	return accounts.filter(account => !validInvestmentAccounts.includes(account.type));
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
					itemId: item.item_id,
					institution_id: item.institution_id as string,
					country_codes: ['US'] as CountryCode[],
				};

			});

		const institutionRequests = requests.map((req) => {
			const plaidRequest = {
				institution_id: req.institution_id,
				country_codes: req.country_codes
			};

			return {
				itemId: req.itemId,
				request: client.institutionsGetById(plaidRequest).catch(() => "ERR")
			};

		});

		const res = institutionRequests.map(async (x) => {
			return {
				itemId: x.itemId,
				response: await x.request
			};
		})

		const x = await Promise.all(res)

		const results = x
			.filter(y => y.response !== "ERR")
			.map(x => {

				const response = x.response as AxiosResponse<InstitutionsGetByIdResponse>;
				const institution = response.data.institution;

				return {
					itemId: x.itemId,
					institution
				}
			});

			return results;

	} catch (err) {

		return []

	}

};

export const unlinkPlaidItem = async (itemId: string, numTries = 0) => {

	if (numTries > 5) {
		throw new Error("Could not remove access token after 5 tries");
	}

	const x = await retrieveItemIdToAccessTokenMap();

	const accessToken = x[itemId];

	try {

		console.log("removing account with access token", accessToken);

		// await client.itemRemove({ access_token: accessToken });

	} catch (error) {
		unlinkPlaidItem(itemId, numTries++);
	}

};
