import { AccountBase } from "plaid";
import { Link } from "@remix-run/react";
import { dollarFormatter, lowerCase, replaceSpacesWithDashes } from "~/helpers/formatters";
import { positiveAccountTypes } from "./NetworthComponent";

export const AccountsList = (
	props: { children?: React.ReactNode, balances: AccountBase[] }
) => {

	const { balances } = props;

	const totalBalance = balances.reduce(
		(acc, account) => {
			const isPositive = positiveAccountTypes.includes(account.type);
			return isPositive ?
				acc + (account.balances.current ?? 0) :
				acc - (account.balances.current ?? 0)
		},
		0
	);

	return (
		<>
			{props.children}
			<h3>Account Balances: {dollarFormatter.format(totalBalance)}</h3>

			{
				balances.map((account) => {
					return (
						<Link key={account.account_id} to={`/accounts/${replaceSpacesWithDashes(lowerCase(account.name))}`}>
							<p>{account.name}</p>
						</Link>
					);
				})
			}
		</>
	);

};
