
import { Holding, Security } from "plaid";
import { json, Link, LinksFunction, LoaderFunction, MetaFunction, useLoaderData, useOutletContext, useParams } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Positions/Positions";
import { decimalFormatter } from "~/helpers/formatters";
import { getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { DashboardProps } from "../../types/index";
import investmentStyles from '~/styles/investment.css';

export const meta: MetaFunction = () => {
	return {
		title: "Position Information",
		description: "See specifics on individual positions"
	};
};

export const links: LinksFunction = () => {

	return [
		{ rel: "stylesheet", href: investmentStyles }
	];

};
export const loader: LoaderFunction = async () => {

	const balances = await getPlaidAccountBalances();

	return json(
		{ balances },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const IndividualInvestmentInformation = () => {
	const { balances } = useLoaderData<DashboardProps>();
	const { securities, holdings } = useOutletContext<{ securities: Security[], holdings: Holding[] }>();

	const params = useParams();
	const securityId = params.position ?? "";
	const holdingsOfCurrentSecurity = holdings.filter(holding => holding.security_id === securityId);

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);
	const tickerSymbol = securityIdToTickerSymbol[securityId] ?? "Not Found";

	// const holdings = holdings.filter(holding => holding.security_id === securityId);

	const accountIdToNumberOfShares = holdings
		.filter(holding => holding.security_id === securityId)
		.reduce((acc, curr) => {

			if (acc[curr.account_id]) {
				return {
					...acc,
					[curr.account_id]: acc[curr.account_id] + curr.quantity
				}
			} else {
				return {
					...acc,
					[curr.account_id]: curr.quantity
				}
			}
		}, {} as Record<string, number>);

	const getAccountNameById = (accountId: string) => {
		const account = balances.find(account => account.account_id === accountId);

		return account?.name ??
			account?.official_name ??
			account?.account_id ??
			"Account Name not found";
	};

	const totalNumberShares = decimalFormatter.format(
		holdingsOfCurrentSecurity
			.reduce((acc, curr) => acc + curr.quantity, 0)
	);

	return (
		<div className="investment">
			<h1>Accounts Holding {tickerSymbol}</h1>

			<h3>Total number of shares: {totalNumberShares}</h3>

			{
				holdingsOfCurrentSecurity.map(holding => {
					const accountName = getAccountNameById(holding.account_id);
					const numberOfShares = accountIdToNumberOfShares[holding.account_id];
					const formattedNumberOfShares = decimalFormatter.format(numberOfShares);

					return (
						<Link key={holding.account_id} to={`/accounts/${holding.account_id}`}>
							<p>{accountName}: {formattedNumberOfShares} shares</p>
						</Link>)
				})
			}
		</div>
	);

};

export default IndividualInvestmentInformation;
