import { AccountBase, Holding, Security } from "plaid";
import { Link } from "remix";

export const InvestmentAccounts = (props: {balances: AccountBase[], securities: Security[], holdings: Holding[]}) => {

	const { balances } = props;

	const investmentAndBrokerageAccounts = balances.filter((account) => {
		return account.type === "investment" || account.type === "brokerage"
	});

	return (
		<>
			{
				investmentAndBrokerageAccounts.map((account) => {
					return (
						<Link key={account.account_id} to={`/accounts/${account.account_id}`}>
							<p>{account.name}</p>
						</Link>
					);
				})
			}
		</>
	);

};
