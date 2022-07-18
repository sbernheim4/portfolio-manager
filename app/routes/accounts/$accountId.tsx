import { json, LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Positions, links as positionsStyles } from "~/components/Positions/Positions";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import { StockPieChart } from "~/components/Positions/StockPieChart/StockPieChart";
import { PositionsTable } from "~/components/Positions/PositionsTable/PositionsTable";
import accountIdStyles from './../../styles/accounts/accountId.css';

export const meta: MetaFunction = () => {
	return {
		title: "Account Overview",
		description: "View all your investment accounts"
	};
};

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: accountIdStyles },
		...positionsStyles(),
	];
};

export const loader = async ({ request, params }: LoaderArgs) => {

	const accountId = params.accountId ?? "";

	const username = await getUserNameFromSession(request);
	const balances = await getPlaidAccountBalances(username);
	const { holdings, securities } = await getInvestmentHoldings(username);

	const holdingsInCurrentAccount = holdings.filter(holding => holding.account_id.toLowerCase() === accountId);

	const account = balances.find(acc => acc.account_id.toLowerCase() === accountId);

	return json({
		account,
		holdingsInCurrentAccount,
		securities
	});

};

const Accounts = () => {
	const {
		securities,
		holdingsInCurrentAccount,
		account
	} = useLoaderData<typeof loader>();

	if (account === undefined) {
		return (<div className="account-id"><h1>Could not pull your account information :(. Please try again in a litle bit</h1></div>)
	}

	return (
		<div className="account-id">
			<h1 className="account-id__name">{account.name}</h1>

			<Positions>
				<PositionsTable holdings={holdingsInCurrentAccount} securities={securities} />
				<br />
				<StockPieChart holdings={holdingsInCurrentAccount} securities={securities} />
			</Positions>
		</div>
	);
};

export default Accounts;
