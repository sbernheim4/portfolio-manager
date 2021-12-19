import { AccountBase, Holding, Security } from "plaid";
import { Link } from "remix";

export const InvestmentAccounts = (props: {balances: AccountBase[], securities: Security[], holdings: Holding[]}) => {

	const { balances, securities, holdings } = props;

	const foo = balances.filter((account) => {
		return account.type === "investment" || account.type === "brokerage"
	});

	return (
		<>
		<h1>Investment and Brokerage Accounts</h1>

		{
			foo.map((account) => {
				return (
					<Link key={account.account_id} to={`/account/${account.account_id}`}>
						<p>{account.name}</p>
					</Link>
				);
			})
		}
		</>
	);

};
