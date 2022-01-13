import { AccountBase } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { dollarFormatter } from "~/helpers/formatters";
import { filterForInvestmentAccounts, filterForNonInvestmentAccounts, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import { sumAccountBalances } from "~/helpers/sumAccountBalances";
import { loaderWithLogin } from "~/remix-helpers";

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

export const loader: LoaderFunction = async (args) => {

	return loaderWithLogin(async () => {
		const username = await getUserNameFromSession(args.request);
		const balances = await getPlaidAccountBalances(username);
		const investmentAccounts = filterForInvestmentAccounts(balances);
		const nonInvestmentAccounts = filterForNonInvestmentAccounts(balances);

		return json(
			{
				investmentAccounts,
				nonInvestmentAccounts
			},
			{ headers: { "Cache-Control": "max-age=43200" } }
		);
	})(args);

};

const Accounts = () => {
	const investmentData = useLoaderData<{
		investmentAccounts: AccountBase[],
		nonInvestmentAccounts: AccountBase[],
	}>();

	const {
		investmentAccounts,
		nonInvestmentAccounts
	} = investmentData;

	const allAccounts = [
		...investmentAccounts,
		...nonInvestmentAccounts
	];

	const totalBalance = sumAccountBalances(allAccounts);

	return (
		<div className="accounts">

			<h1>Account Balances: {dollarFormatter.format(totalBalance)}</h1>

			<InvestmentAccounts balances={investmentAccounts}>
				<h2>Investment and Brokerage Accounts</h2>
			</InvestmentAccounts>

			<InvestmentAccounts balances={nonInvestmentAccounts}>
				<h2>Cash and Loan Accounts</h2>
			</InvestmentAccounts>

		</div>
	);
};

export default Accounts;
