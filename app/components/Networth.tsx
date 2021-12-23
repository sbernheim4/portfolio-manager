import { AccountBase } from "plaid";
import { dollarFormatter } from "~/helpers/formatters";

const positiveAccountTypes = [
	"investment",
	"depository",
	"brokerage",
];

export const Networth = (props: { accounts: AccountBase[] }) => {
	const { accounts } = props;

	const networth = accounts.reduce(
		(acc, account) => {
			const isPositive = positiveAccountTypes.includes(account.type);
			return isPositive ?
				acc + (account.balances.current ?? 0) :
				acc - (account.balances.current ?? 0)
		},
		0
	)

	return (
		<div className="networth">
			<h1>Your Financial* Networth</h1>

			<h2>Account Balances: {dollarFormatter.format(networth)}</h2>
			<br />
			{ accounts.map(account => <AccountInfo key={account.account_id} account={account}/>) }

			<p>*You're worth far more than this 🙂</p>
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
