import { AccountBase, Holding, Security } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Positions, links as positionsStyles } from "~/components/Positions/Positions";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import { lowerCase, replaceSpacesWithDashes } from "~/helpers/formatters";

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

	const accountName = params.accountId ?? "";

	const username = await getUserNameFromSession(request);
	const accountData = await getPlaidAccountBalances(username);
	const { holdings, securities } = await getInvestmentHoldings(username);

	const accountNamesToAccountId = accountData.reduce((acc, curr) => {
		const accountNameNormalized = replaceSpacesWithDashes(lowerCase(curr.name));

		return {
			...acc,
			[accountNameNormalized]: curr.account_id
		}
	});

	const accountId = accountNamesToAccountId[accountName];
	const holdingsInCurrentAccount = holdings.filter(holding => holding.account_id === accountId);
	const account = accountData.find(acc => acc.account_id === accountId);

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
