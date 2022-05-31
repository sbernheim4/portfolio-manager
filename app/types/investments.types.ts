import { Holding, Security } from "plaid";

export type NewXirrCalculation = { error: undefined; value: number; } | { error: string; value: undefined; };

export type PositionsLoaderData = {
	holdings: Holding[];
	securities: Security[];
	todaysInvestmentBalances: number;
	xirr: NewXirrCalculation,
	xirrDataLastUpdatedOn: string | undefined;
};
