import { AccountBase, Holding, Security } from "plaid";

export type DashboardProps = {
	balances: AccountBase[];
	holdings: Holding[];
	securities: Security[];
}

export type InvestmentResponse = {
	holdings: Holding[];
	securities: Security[];
}

