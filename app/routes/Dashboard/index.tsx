import { json, LinksFunction, LoaderFunction, useLoaderData } from "remix"
import { AccountBase } from "plaid";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { isFilled } from "~/helpers/isFilled";
import { Positions } from '~/components/Investments';
import dashboardStyles from './../../styles/dashboard.css';
import { Networth } from '~/components/Networth';
import { DashboardProps, InvestmentResponse } from '../../types/index';
import { InvestmentAccounts } from '~/components/InvestmentAccounts';

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: dashboardStyles }
	];
};

export const loader: LoaderFunction = async () => {

	const promises: [
		Promise<InvestmentResponse>,
		Promise<Array<AccountBase>>
	] = [
		getInvestmentHoldings(),
		getPlaidAccountBalances()
	];

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
			<Positions securities={securities} holdings={holdings} />
			<InvestmentAccounts balances={balances} securities={securities} holdings={holdings}/>
			<Networth accounts={balances} />
		</div>
    );

};

export default Dashboard;
