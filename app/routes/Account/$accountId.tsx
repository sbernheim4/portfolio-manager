import { AccountBase, Holding, Security } from "plaid";
import { json, LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Investments";
import { StockInvestmentSummary } from "~/components/StockInvestmentSummary";
import { dollarFormatter } from "~/formatters";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import accountIdStyles from "./../../styles/account.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: accountIdStyles }
	]
};

export const loader: LoaderFunction = async ({params}) => {
	const accountId = params.accountId;

	const accountInfo = await getPlaidAccountBalances();
	const { holdings, securities } = await getInvestmentHoldings();

	const holdingsInCurrentAccount = holdings.filter(holding => holding.account_id === accountId)

	const accountBalance = accountInfo.find(acc => acc.account_id === accountId)

	return json({
		accountBalance,
		holdingsInCurrentAccount,
		securities
	});
};

const Accounts = () => {
	const {
		securities,
		holdingsInCurrentAccount,
		accountBalance
	} = useLoaderData<{
		accountBalance: AccountBase,
		holdingsInCurrentAccount: Holding[],
		securities: Security[]
	}>();

	const currentAmount = accountBalance.balances.current ?
		dollarFormatter.format(accountBalance.balances.current) :
		"N/A";

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);

	return (
		<div className="accounts">
			<h1>{accountBalance.name}</h1>
			<h3>Balance: {currentAmount}</h3>

			<h3>Account Holdings</h3>
				<div className="investment-line-items">
				{
					holdingsInCurrentAccount.map(holding => {
						return (
							<StockInvestmentSummary
								totalInvested={accountBalance.balances.current ?? 1000000}
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
