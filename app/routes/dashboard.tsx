import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Positions, links as positionsStyles } from '~/components/Positions/Positions';
import dashboardStyles from './../styles/dashboard.css';
import { BalancesHoldingsSecurities } from '~/types/index';
import { AccountsList } from '~/components/InvestmentAccounts';
import { filterForInvestmentAccounts } from "~/helpers/plaidUtils";
import { validateIsLoggedIn } from "~/remix-helpers";
import { getUserNameFromSession } from "~/helpers/session";
import { getInvestmentsAndAccountBalances } from "./investments";
import { useLoggedIn } from "~/hooks/useLoggedIn";

export const meta: MetaFunction = () => {
	return {
		title: "Analyze your Investment Portfolio",
		description: "Portfolio analysis by position weight, sector weight, and more"
	};
};

export const links: LinksFunction = () => {
	return [
		...positionsStyles(),
		{ rel: "stylesheet", href: dashboardStyles }
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

const Dashboard = () => {
	useLoggedIn();

	const investmentData = useLoaderData<BalancesHoldingsSecurities>();
	const { holdings, securities, balances } = investmentData;
	return (
		<div className="dashboard">
			<Positions securities={securities} holdings={holdings} />

			<h1>Your Portfolio Balance</h1>
			<AccountsList balances={balances} />
		</div>
	);

};

export default Dashboard;
