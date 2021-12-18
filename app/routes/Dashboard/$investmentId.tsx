import { AccountBase, Holding, Security } from "plaid";
import { json, Link, LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Investments";
import { getAccounts, getInvestmentHoldings } from "~/helpers/plaidUtils";
import investmentStyles from './../../styles/investment.css';

export const links: LinksFunction = () => {

	return [
		{ rel: "stylesheet", href: investmentStyles }
	];

};

export const loader: LoaderFunction = async (loaderParams) => {

	// SEE https://discord.com/channels/770287896669978684/771068344320786452/921832785096880178
	// for another idea

	const investmentData = await getInvestmentHoldings();
	const holdings = investmentData.holdings.filter(holding => holding.security_id ===loaderParams.params.investmentId);
	const accountIdsToFetch = holdings.map(holding => holding.account_id);

	const accountInfo = await getAccounts(accountIdsToFetch);

	return json(
		{ accounts: accountInfo, holdings, securities: investmentData.securities },
		{ headers: { "Cache-Control": "max-age=240" } }
	);

};

const IndividualInvestmentInformation = () => {

	// When linked from /dashboard the data already exists and doesn't need to be fetched
	// const { state } = useLocation();
    // const isDirectLink = !!state?.holding;

	const { accounts, holdings, securities } = useLoaderData<{accounts: AccountBase[], holdings: Holding[], securities: Security[]}>();

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);
	const security_id = holdings[0].security_id;
	const ticker = securityIdToTickerSymbol[security_id] ?? "Not Found";

	holdings[0].account_id

	const accountIdToHolding = holdings.reduce((acc, curr) => {
		return {
			...acc,
			[curr.account_id]: curr.quantity
		}
	}, {} as Record<string, number>);

	return (
        <div className="investment">
			<h1>Accounts Holding {ticker}</h1>
			{accounts.map(account => <Link to={`/account/${account.account_id}`}><p key={account.account_id}>{account.name}: {accountIdToHolding[account.account_id]} shares</p></Link>)}
		</div>
	);

};

export default IndividualInvestmentInformation;
