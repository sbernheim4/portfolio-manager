import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix"
import { Positions, links as positionsStyles } from '~/components/Positions';
import dashboardStyles from './../../styles/dashboard.css';
import { Networth } from '~/components/Networth';
import { DashboardProps } from '../../types/index';
import { InvestmentAccounts } from '~/components/InvestmentAccounts';
import { getInvestmentsAndAccountBalances } from "../positions";

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

export const loader: LoaderFunction = async () => {

	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances();

	return json(
		{ balances, holdings, securities },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const Dashboard = () => {
    const investmentData = useLoaderData<DashboardProps>();
	const { holdings, securities, balances } = investmentData;

    return (
		<div className="dashboard">
			<Positions securities={securities} holdings={holdings} />

			<InvestmentAccounts balances={balances} securities={securities} holdings={holdings}/>

			<Networth accounts={balances} />
		</div>
    );

};

export default Dashboard;
