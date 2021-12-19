import { LinksFunction, useOutletContext } from 'remix';
import { Positions } from '~/components/Investments';
import dashboardStyles from './../../styles/dashboard.css';
import { Networth } from '~/components/Networth';
import { DashboardProps } from '../dashboard';
import { InvestmentAccounts } from '~/components/InvestmentAccounts';

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: dashboardStyles }
	];
};

const Dashboard = () => {
    const investmentData = useOutletContext<DashboardProps>();
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
