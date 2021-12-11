import { AccountBase } from "plaid";
import { dollarFormatter } from "~/formatters";

export const Networth = (props: { accounts: AccountBase[] }) => {
	const { accounts } = props;

	// TODO: Account for loan and credit card accounts
	const networth = accounts.reduce((acc, curr) => acc + (curr.balances.current ?? 0), 0)

	return (
		<div className="networth">
			<h1>Your Financial* Networth</h1>

			<h2>You have {dollarFormatter.format(networth)}</h2>
			{ accounts.map(account => <AccountInfo account={account}/>) }

			<p>*You're worth far more than this 🙂</p>
		</div>
	);
};

const AccountInfo = (props: {account: AccountBase}) => {
	const { account } = props;

	// TODO: Account for loan and credit card accounts
	return (
		<h4>{account.name}: {dollarFormatter.format(account.balances.current ?? 0)}</h4>
	);
};
