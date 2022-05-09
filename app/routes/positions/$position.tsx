
import { AccountBase, Holding, Security } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useOutletContext, useParams } from "@remix-run/react";
import { constructSecurityIdToTickerSymbol } from "~/components/Positions/Positions";
import { decimalFormatter } from "~/helpers/formatters";
import { getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getUserNameFromSession } from "~/helpers/session";
import investmentStyles from '~/styles/investment.css';
import { Option } from "excoptional";

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
export const loader: LoaderFunction = async ({ request }) => {

	const username = await getUserNameFromSession(request);
	const balances = await getPlaidAccountBalances(username);

	return json(
		{ balances },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const IndividualInvestmentInformation = () => {
	const { balances } = useLoaderData<{ balances: AccountBase[] }>();

	const {
		securities,
		holdings
	} = useOutletContext<{ securities: Security[], holdings: Holding[] }>();

	const params = useParams();
	const tickerSymbol = params.position ?? "";
	const securityId = Option.of(securities.find(sec => sec.ticker_symbol === tickerSymbol)?.security_id);
	const holdingsOfCurrentSecurity = securityId.map(secId => holdings.filter(holding => holding.security_id === secId));

	// const holdings = holdings.filter(holding => holding.security_id === securityId);

	const accountIdToNumberOfShares = securityId.map(secId => {

		return holdings
			.filter(holding => holding.security_id === secId)
			.reduce((acc, curr) => {

				const newQuantity = acc[curr.account_id] ?
					acc[curr.account_id] + curr.quantity :
					curr.quantity

				return {
					...acc,
					[curr.account_id]: newQuantity
				};

			}, {} as Record<string, number>);
	})


	/*
	 * Helper function to retrieve an account's name given its ID
	 */
	const getAccountNameById = (accountId: string) => {
		const account = balances.find(account => account.account_id === accountId);

		return account?.name ??
			account?.official_name ??
			account?.account_id ??
			"Account Name not found";
	};

	/*
	 * The total number of shares of a single stock held across all accounts
	 */
	const totalNumberShares = holdingsOfCurrentSecurity.map(h => {
		return h.reduce((acc, curr) => acc + curr.quantity, 0)
	}).map(x => {
		return decimalFormatter.format(x);
	})


	return (
		<div className="investment">
			<h1>Accounts Holding {tickerSymbol}</h1>

			<h3>Total number of shares: {totalNumberShares.getOrElse("Could not determine the number of total owned shares")}</h3>

			{
				holdingsOfCurrentSecurity.map(holding => {

					return holding.map(h => {
						const accountName = getAccountNameById(h.account_id);
						const numberOfShares = accountIdToNumberOfShares.map(x => x[h.account_id]);
						const formattedNumberOfShares = numberOfShares.map(numShares => decimalFormatter.format(numShares));

						return (
							<Link key={h.account_id} to={`/accounts/${h.account_id}`}>
								<p>{accountName}: {formattedNumberOfShares.getOrElse("Could not determine the number of total owned shares")} shares</p>
							</Link>
						);

					});
				}).getOrElse(<p>No accounts holding {tickerSymbol}</p>)
			}
		</div>
	);

};

export default IndividualInvestmentInformation;
