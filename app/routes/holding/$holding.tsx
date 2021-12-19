
import { AccountBase } from "plaid";
import { json, Link, LinksFunction, LoaderFunction, MetaFunction, useLoaderData, useParams } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Positions";
import { decimalFormatter, percentageFormatter } from "~/helpers/formatters";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { DashboardProps, InvestmentResponse } from "../../types/index";
import investmentStyles from './../../styles/investment.css';

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
export const loader: LoaderFunction = async ({params}) => {

	const securityId = params.holding
	const promises: [Promise<InvestmentResponse>, Promise<Array<AccountBase>> ] = [getInvestmentHoldings(), getPlaidAccountBalances()];
	const results = await Promise.allSettled(promises);

	// @ts-ignore
	const resolvedPromises: [
		InvestmentResponse,
		AccountBase[]
	] = results
		// @ts-ignore
		.filter(isFilled)
		// @ts-ignore
		.map(x => x.value);

	const [investmentData, balances] = resolvedPromises;
	const { holdings, securities } = investmentData;

	const holdingsOfCurrentSecurity = holdings.filter(holding => holding.security_id === securityId);

	return json(
		{ balances, holdings: holdingsOfCurrentSecurity, securities },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const IndividualInvestmentInformation = () => {
	const { balances, holdings, securities } = useLoaderData<DashboardProps>();
	const params = useParams();
	const securityId = params.holding ?? "";

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

		return account?.name ?? account?.official_name ?? account?.account_id ?? "Account Name not found";
	};

	const totalNumberShares = decimalFormatter.format(
		holdings
			.reduce((acc, curr) => acc + curr.quantity, 0)
	);

	const totalNumberOfSharesOfSecurity = holdings.filter(h => h.security_id === securityId).reduce((acc, curr) => acc + curr.quantity, 0);


	return (
        <div className="investment">
			<h1>Accounts Holding {tickerSymbol}</h1>

            <p>Total number of shares: {totalNumberShares}</p>

			{
			holdings.map(holding => {
				const percentage = percentageFormatter.format(holding.institution_value / totalNumberOfSharesOfSecurity);

				return (
					<Link key={holding.account_id} to={`/account/${holding}`}>
						<p>{getAccountNameById(holding.account_id)}: {decimalFormatter.format(accountIdToNumberOfShares[holding.account_id])} shares - {percentage}</p>
					</Link>)
				})
			}
		</div>
	);

};

export default IndividualInvestmentInformation;
