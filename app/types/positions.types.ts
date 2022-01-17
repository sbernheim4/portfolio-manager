import { Holding, Security } from "plaid";

export type PositionsLoaderData = {
	holdings: Holding[];
	securities: Security[];
	xirr: number;
	todaysInvestmentBalances: number;
};
