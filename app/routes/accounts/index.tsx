import { AccountBase } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AccountsList } from "~/components/InvestmentAccounts";
import { dollarFormatter } from "~/helpers/formatters";
import { filterForInvestmentAccounts, filterForNonInvestmentAccounts, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import { positiveAccountTypes } from "~/components/NetworthComponent";
import { validateIsLoggedIn } from "~/remix-helpers";

export const meta: MetaFunction = () => {
	return {
		title: "Account Specific Information",
		description: "View your investments for a given account"
	};
};

export const links: LinksFunction = () => {
	return [ ];
};

export const loader: LoaderFunction = async (args) => {

	await validateIsLoggedIn(args.request);

	const username = await getUserNameFromSession(args.request);
	const balances = await getPlaidAccountBalances(username);
	const investmentAccounts = filterForInvestmentAccounts(balances);
	const nonInvestmentAccounts = filterForNonInvestmentAccounts(balances);

	const totalBalance = sumAccountBalances(balances);

	return json(
		{
			investmentAccounts,
			nonInvestmentAccounts,
			totalBalance
		},
		{ headers: { "Cache-Control": "private, max-age=14400, stale-while-revalidate=28800" } }
	);

};

/**
 * Sum the balances of the passed in accounts accounting for credit and loan
 * accounts
 */
const sumAccountBalances = (accounts: AccountBase[]) => {

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

/**
 * The route component
 */
const Accounts = () => {
	const data = useLoaderData<{
		investmentAccounts: AccountBase[],
		nonInvestmentAccounts: AccountBase[],
		totalBalance: number
	}>();

	const {
		investmentAccounts,
		nonInvestmentAccounts,
		totalBalance
	} = data;


	return (
		<div className="accounts">

			<h1>Account Balances: {dollarFormatter.format(totalBalance)}</h1>

			<AccountsList balances={investmentAccounts}>
				<h2>Investment and Brokerage Accounts</h2>
			</AccountsList>

			<AccountsList balances={nonInvestmentAccounts}>
				<h2>Cash and Loan Accounts</h2>
			</AccountsList>

		</div>
	);
};

export default Accounts;
