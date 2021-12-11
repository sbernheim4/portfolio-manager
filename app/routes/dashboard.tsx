import { getInvestmentHoldings, getPlaidAccountBalances } from '~/helpers/plaidUtils';
import { LinksFunction, LoaderFunction, useLoaderData } from 'remix';
import { Investments } from '~/components/Investments/Investments';
import { AccountBase, Holding, Security } from 'plaid';
import dashboardStyles from './../styles/dashboard.css';
import { Networth } from '~/components/Investments/Networth';

export const links: LinksFunction = () => {

	return [
		{ rel: "stylesheet", href: dashboardStyles }
	];

};

type InvestmentResponse = {
	holdings: Holding[];
	securities: Security[];
}

type DashboardProps = {
	holdings: Holding[];
	securities: Security[];
	balances: AccountBase[];
}

export const loader: LoaderFunction = async () => {

	const investmentData: InvestmentResponse = await getInvestmentHoldings();
	const balances: AccountBase[] = await getPlaidAccountBalances();

	return {
		...investmentData,
		balances
	};

};

const Dashboard = () => {
    const investmentData = useLoaderData<DashboardProps>();
	const { holdings, securities, balances } = investmentData;

    return (
		<>
			<Investments securities={securities} investments={holdings} />
			<Networth accounts={balances} />
		</>
    );

};

export default Dashboard;
