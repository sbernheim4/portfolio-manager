import { AccountBase } from "plaid";
import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AccountsList } from "~/components/InvestmentAccounts";
import { dollarFormatter } from "~/helpers/formatters";
import { filterForInvestmentAccounts, filterForNonInvestmentAccounts, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import { positiveAccountTypes } from "~/components/NetworthComponent";
import { validateIsLoggedIn } from "~/remix-helpers";
import { useLoggedIn } from "~/hooks/useLoggedIn";
import accountStyles from './../../styles/accounts/accounts.css';

export const meta: MetaFunction = () => {
	return {
		title: "Account Specific Information",
		description: "View your investments for a given account"
	};
};

export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: accountStyles },
	];
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

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const action = formData.get("action");

	switch (action) {
		case 'isLoggedIn':
			await validateIsLoggedIn(request);
		default:
			return null;
	}
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

	useLoggedIn();

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

			<h1 className="accounts__balances">Account Balances: {dollarFormatter.format(totalBalance)}</h1>

			<div className="accounts__list">

				<div className="accounts__list__investment">
					<AccountsList balances={investmentAccounts}>
						<h2>Investment and Brokerage Accounts</h2>
					</AccountsList>
				</div>

				<div className="accounts__list__cash">
					<AccountsList balances={nonInvestmentAccounts}>
						<h2>Cash and Loan Accounts</h2>
					</AccountsList>
				</div>

			</div>


		</div>
	);
};

export default Accounts;
