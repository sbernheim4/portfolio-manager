import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Positions, links as positionsStyles } from '~/components/Positions/Positions';
import dashboardStyles from './../styles/dashboard/dashboard.css';
import { AccountsList } from '~/components/InvestmentAccounts';
import { filterForInvestmentAccounts } from "~/helpers/plaidUtils";
import { validateIsLoggedIn } from "~/remix-helpers";
import { getUserNameFromSession } from "~/helpers/session";
import { getInvestmentsAndAccountBalances } from "./investments";
import { useLoggedIn } from "~/hooks/useLoggedIn";
import { PositionsTable } from "~/components/Positions/PositionsTable/PositionsTable";
import { AccountBase, Holding, Security } from "plaid";

export const meta: MetaFunction = () => {
	return {
		title: "Analyze your Investment Portfolio",
		description: "Portfolio analysis by position weight, sector weight, and more"
	};
};

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: dashboardStyles },
		...positionsStyles(),
	];
};

export const loader: LoaderFunction = async (args) => {

	await validateIsLoggedIn(args.request);

	const username = await getUserNameFromSession(args.request);
	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances(username);
	const investmentAccounts = filterForInvestmentAccounts(balances);

	return json(
		{ balances: investmentAccounts, holdings, securities },
		{ headers: { "Cache-Control": "private, max-age=14400, stale-while-revalidate=28800" } }
	);


};

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const action = formData.get("action");

	switch (action) {
		case 'isLoggedIn':
			await validateIsLoggedIn(request)

		default:
			return null;
	}
};

type BalancesHoldingsSecurities = {
	balances: AccountBase[];
	holdings: Holding[];
	securities: Security[];
};

const Dashboard = () => {
	useLoggedIn();

	const investmentData = useLoaderData<BalancesHoldingsSecurities>();
	const { holdings, securities, balances } = investmentData;
	return (
		<div className="dashboard">

			<h1>Dashboard</h1>

			<div className="dashboard__positions">
				<Positions>
					<PositionsTable securities={securities} holdings={holdings} />
				</Positions>
			</div>

			<br />

			<div className="dashboard__account-list">
				<h1>Your Portfolio Balance</h1>
				<AccountsList balances={balances} />
			</div>
		</div>
	);

};

export default Dashboard;
