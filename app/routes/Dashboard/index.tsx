import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix"
import { Positions, links as positionsStyles } from '~/components/Positions/Positions';
import dashboardStyles from './../../styles/dashboard.css';
import { BalancesHoldingsSecurities } from '~/types/index';
import { InvestmentAccounts } from '~/components/InvestmentAccounts';
import { getInvestmentsAndAccountBalances } from "../positions";
import { filterForInvestmentAccounts } from "~/helpers/plaidUtils";
import { loaderWithLogin } from "~/remix-helpers";
import { getUserNameFromSession } from "~/helpers/session";

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

	return loaderWithLogin(async () => {

		const username = await getUserNameFromSession(args.request);
		const { balances, holdings, securities } = await getInvestmentsAndAccountBalances(username);
		const investmentAccounts = filterForInvestmentAccounts(balances);

		return json(
			{ balances: investmentAccounts, holdings, securities },
			{ headers: { "Cache-Control": "max-age=43200" } }
		);

	})(args);

};

const Dashboard = () => {
	const investmentData = useLoaderData<BalancesHoldingsSecurities>();
	const { holdings, securities, balances } = investmentData;

	return (
		<div className="dashboard">
			<Positions securities={securities} holdings={holdings} />

			<h1>Your Portfolio Balance</h1>
			<InvestmentAccounts balances={balances} />
		</div>
	);

};

export default Dashboard;
