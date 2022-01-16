import { AccountBase, Holding, Security } from "plaid";

export type ValueOf<T> = T[keyof T];

export type BalancesHoldingsSecurities = {
	balances: AccountBase[];
	holdings: Holding[];
	securities: Security[];
};

export type HoldingsSecurities = {
	holdings: Holding[];
	securities: Security[];
};
