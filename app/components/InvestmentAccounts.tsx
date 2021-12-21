import { AccountBase, Holding, Security } from "plaid";
import { Link } from "remix";

export const InvestmentAccounts = (props: {balances: AccountBase[], securities: Security[], holdings: Holding[]}) => {

	const { balances } = props;

	const investmentAndBrokerageAccounts = balances.filter((account) => {
		return account.type === "investment" || account.type === "brokerage"
	});

	return (
		<>
			<h1>Investment and Brokerage Accounts</h1>

			{
				investmentAndBrokerageAccounts.map((account) => {
					return (
						<Link key={account.account_id} to={`/account/${account.account_id}`}>
							{account.name}
						</Link>
					);
				})
			}
		</>
	);

};
