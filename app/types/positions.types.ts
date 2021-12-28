import { Holding, InvestmentTransaction, Security } from "plaid";

export type PositionsLoaderData = {
	holdings: Holding[];
	securities: Security[];
    investmentTransactions: InvestmentTransaction[];
	cashflows: [number[], Date[]];
};
