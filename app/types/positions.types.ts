import { Holding, Security } from "plaid";

export type PositionsLoaderData = {
	holdings: Holding[];
	securities: Security[];
	todaysInvestmentBalances: number;
	xirr: number;
	xirrDataLastUpdatedOn: string | undefined;
};
