import { Security } from "plaid";

export const constructSecurityIdToTickerSymbol = (securities: Array<Security>) => {

	const securityIdToTickerSymbol = securities.reduce((acc, curr) => {

		const tickerSymbol = curr.ticker_symbol ?? undefined;

		return {
			...acc,
			[curr.security_id]: tickerSymbol
		};

	}, {} as Record<string, string | undefined>);

	return securityIdToTickerSymbol;

};

