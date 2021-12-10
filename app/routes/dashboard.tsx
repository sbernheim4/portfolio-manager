import { getInvestmentHoldings } from '~/helpers/plaidUtils';
import { LoaderFunction, useLoaderData } from 'remix';
import { Investments } from '~/components/Investments/Investments';
import { Holding } from 'plaid';

export const loader: LoaderFunction = async () => {

	const investmentData = await getInvestmentHoldings();

	return investmentData;

};

const Dashboard = () => {
    const holdings = useLoaderData<Holding[]>();

    return (
        <Investments investments={holdings} />
    );

};

export default Dashboard;
