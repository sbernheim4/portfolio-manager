
import { Holding, Security } from "plaid";
import { json, LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useOutletContext, useParams } from "@remix-run/react";
import { decimalFormatter, lowerCase, replaceSpacesWithDashes } from "~/helpers/formatters";
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
export const loader = async ({ request }: LoaderArgs) => {

	const username = await getUserNameFromSession(request);
	const balances = await getPlaidAccountBalances(username);

	return json(
		{ balances },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const IndividualInvestmentInformation = () => {
	const { balances } = useLoaderData<typeof loader>();

	const {
		securities,
		holdings
	} = useOutletContext<{ securities: Security[], holdings: Holding[] }>();

	const params = useParams();
	const tickerSymbolOpt = Option.of(params.investment);

	/*
	 * Helper function to retrieve an account's name given its ID
	 */
	const getAccountNameById = (accountId: string) => {
		const account = Option.of(balances.find(account => account.account_id === accountId)).map(account => account.name);

		return account;
	};

	const response = tickerSymbolOpt.map(tickerSymbol => {

		const securityIdOpt = Option.of(securities.find(sec => sec.ticker_symbol === tickerSymbol)).map(x => x.security_id);

		const holdingsOfCurrentSecurity = securityIdOpt
			.map(securityId => holdings.filter(holding => holding.security_id === securityId))
			.getOrElse<Holding[]>([]);

		/*
		 * The total number of shares of a single stock held across all accounts
		 */
		const shareQuantity = holdingsOfCurrentSecurity.reduce((acc, curr) => acc + curr.quantity, 0);
		const shareQuantityFormatted = decimalFormatter.format(shareQuantity);

		/*
		 * The number of shares held in each account
		 */
		const accountIdToNumberOfShares = securityIdOpt.map(securityId => {

			return holdings
				.filter(holding => holding.security_id === securityId)
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

		const AccountsHoldingSecurity = holdingsOfCurrentSecurity.map(holding => {
			const accountNameOpt = getAccountNameById(holding.account_id)
			const normalizeStringUrl = (str: string) => replaceSpacesWithDashes(lowerCase(str));
			const numberOfShares = accountIdToNumberOfShares.map(x => x[holding.account_id]);
			const formattedNumberOfShares = numberOfShares.map(numShares => decimalFormatter.format(numShares)).getOrElse("Could not determine the number of total owned shares")

			const accountHoldingPosition = accountNameOpt.map(accountName => {

				const row = (
					<Link key={holding.account_id} to={`/accounts/${normalizeStringUrl(accountName)}`}>
						<p>{accountName}: {formattedNumberOfShares} shares</p>
					</Link>
				);

				return row;

			}).getOrElse(
				<p>{holding.account_id}: {formattedNumberOfShares} shares</p>
			);

			return accountHoldingPosition;

		});

		return (
			<div className="investments__position">
				<h1>Accounts Holding {tickerSymbol}</h1>

				<h3>Total number of shares: {shareQuantityFormatted}</h3>

				{AccountsHoldingSecurity}
			</div>
		);
	});

	return response.getOrElse("Error");

};

export default IndividualInvestmentInformation;
