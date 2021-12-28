import { AccountBase } from "plaid";
import { positiveAccountTypes } from "~/components/NetworthComponent";

export const sumAccountBalances = (accounts: AccountBase[]) => {

	const totalBalance = accounts.reduce(
		(acc, account) => {
			const isPositive = positiveAccountTypes.includes(account.type);
			return isPositive ?
				acc + (account.balances.current ?? 0) :
				acc - (account.balances.current ?? 0)
		},
		0
	);

	return totalBalance;

};

