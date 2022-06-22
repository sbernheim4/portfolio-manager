import { Security } from "plaid";

export const constructTickerSymbolToSecurityId = (securities: Array<Security>) => {

	const tickerSymbolToSecurityId = securities.reduce((acc, curr) => {

		return curr.ticker_symbol ?
			{
				...acc,
				[curr.ticker_symbol]: curr.security_id
			} :
			acc;

	}, {} as Record<string, string>);

	return tickerSymbolToSecurityId;

};

