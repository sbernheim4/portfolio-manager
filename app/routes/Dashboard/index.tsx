import { LinksFunction, useOutletContext } from 'remix';
import { Investments } from '~/components/Investments';
import dashboardStyles from './../../styles/dashboard.css';
import { Networth } from '~/components/Networth';
import { DashboardProps } from '../dashboard';

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
			<Investments securities={securities} holdings={holdings} />
			<Networth accounts={balances} />
		</div>
    );

};

export default Dashboard;
