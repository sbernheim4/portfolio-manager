import { getInvestmentHoldings, getPlaidAccountBalances } from '~/helpers/plaidUtils';
import { json, LinksFunction, LoaderFunction, useLoaderData } from 'remix';
import { Investments } from '~/components/Investments';
import { AccountBase, Holding, Security } from 'plaid';
import dashboardStyles from './../../styles/dashboard.css';
import { Networth } from '~/components/Networth';
import { isFilled } from '~/helpers/isFilled';

export const links: LinksFunction = () => {

	return [
		{ rel: "stylesheet", href: dashboardStyles }
	];

};

export type InvestmentResponse = {
	holdings: Holding[];
	securities: Security[];
}

export type DashboardProps = {
	holdings: Holding[];
	securities: Security[];
	balances: AccountBase[];
}

export const loader: LoaderFunction = async () => {

	const promises: [Promise<InvestmentResponse>, Promise<Array<AccountBase>> ] = [getInvestmentHoldings(), getPlaidAccountBalances()];

	const results = await Promise.allSettled(promises);

	// @ts-ignore
	const resolvedPromises: [
		InvestmentResponse,
		AccountBase[]
	] = results
		// @ts-ignore
		.filter(isFilled)
		// @ts-ignore
		.map(x => x.value);

	const [investmentData, balances] = resolvedPromises;

	return json(
		{ ...investmentData, balances },
		{ headers: { "Cache-Control": "max-age=240" } }
	);

};

const Dashboard = () => {
    const investmentData = useLoaderData<DashboardProps>();
	const { holdings, securities, balances } = investmentData;

    return (
		<div className="dashboard">
			<Investments securities={securities} investments={holdings} />
			<Networth accounts={balances} />
		</div>
    );

};

export default Dashboard;
