import { AccountBase, Holding, Security } from "plaid";
import { json, LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Positions";
import { StockInvestmentSummary } from "~/components/StockInvestmentSummary";
import { dollarFormatter } from "~/helpers/formatters";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import accountIdStyles from "./../../styles/account.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: accountIdStyles }
	];
};

export const loader: LoaderFunction = async ({params}) => {
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
		account: AccountBase,
		holdingsInCurrentAccount: Holding[],
		securities: Security[]
	}>();

	const currentAmount = account.balances.current ?
		dollarFormatter.format(account.balances.current) :
		"N/A";

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);

	return (
		<div className="accounts">
			<h1>{account.name}</h1>
			<h3>Balance: {currentAmount}</h3>

			<h3>Account Holdings</h3>
				<div className="investment-line-items">
				{
					holdingsInCurrentAccount.reverse().map(holding => {
						return (
							<StockInvestmentSummary
								key={holding.security_id}
								totalInvested={account.balances.current ?? 1000000}
								holding={holding}
								ticker={securityIdToTickerSymbol[holding.security_id]}
							/>
						)
					})
				}
			</div>
		</div>
	);
};

export default Accounts;
