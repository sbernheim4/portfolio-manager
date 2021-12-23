import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { DashboardProps } from "../../types/index";
import { getInvestmentsAndAccountBalances } from "../positions";

export const meta: MetaFunction = () => {
	return {
		title: "Account Specific Information",
		description: "View your investments for a given account"
	};
};

export const links: LinksFunction = () => {
	return [
	];
};

export const loader: LoaderFunction = async () => {

	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances();

	return json(
		{ balances, holdings, securities },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const Accounts = () => {
    const investmentData = useLoaderData<DashboardProps>();

	const { balances, securities, holdings } = investmentData;

	return (
		<div className="accounts">

			<h1>Investment and Brokerage Accounts</h1>

			<InvestmentAccounts
				balances={balances}
				securities={securities}
				holdings={holdings}
			/>

		</div>
	);
};

export default Accounts;
