import { AccountBase } from "plaid";
import { dollarFormatter } from "~/helpers/formatters";

export const positiveAccountTypes = [
	"investment",
	"depository",
	"brokerage",
];

export const NetworthComponent = (props: { accounts: AccountBase[] }) => {
	const { accounts } = props;

	const networth = accounts.reduce(
		(acc, account) => {
			const isPositive = positiveAccountTypes.includes(account.type);
			return isPositive ?
				acc + (account.balances.current ?? 0) :
				acc - (account.balances.current ?? 0)
		},
		0
	);

	return (
		<div>
			<h2>Account Balances: {dollarFormatter.format(networth)}</h2>
			<br />
			{ accounts.map(account => <AccountInfo key={account.account_id} account={account}/>) }
		</div>
	);
};

const AccountInfo = (props: {account: AccountBase}) => {
	const { account } = props;

	const symbol = positiveAccountTypes.includes(account.type) ? "" : "-";

	// TODO: Account for loan and credit card accounts
	return (
		<h4>{account.name}: {symbol}{dollarFormatter.format(account.balances.current ?? 0)}</h4>
	);
};
