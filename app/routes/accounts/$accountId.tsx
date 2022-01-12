import { AccountBase, Holding, Security } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { Positions, links as positionsStyles } from "~/components/Positions/Positions";
import { dollarFormatter } from "~/helpers/formatters";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";

export const meta: MetaFunction = () => {
	return {
		title: "Account Overview",
		description: "View all your investment accounts"
	};
};

export const links: LinksFunction = () => {
	return [
		...positionsStyles()
	];
};

export const loader: LoaderFunction = async ({ request, params }) => {

	const accountId = params.accountId;

	const accountData = await getPlaidAccountBalances();
	const { holdings, securities } = await getInvestmentHoldings();

	const holdingsInCurrentAccount = holdings.filter(holding => holding.account_id === accountId)
	const account = accountData.find(acc => acc.account_id === accountId)

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
	} = useLoaderData<{
		account: AccountBase | undefined,
		holdingsInCurrentAccount: Holding[],
		securities: Security[]
	}>();

	if (account === undefined) {
		return null;
	}

	return (
		<div className="accounts">
			<h1>{account.name}</h1>

			<Positions securities={securities} holdings={holdingsInCurrentAccount} />
		</div>
	);
};

export default Accounts;
