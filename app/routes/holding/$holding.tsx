
import { AccountBase } from "plaid";
import { json, Link, LinksFunction, LoaderFunction, useLoaderData, useParams } from "remix";
import { constructSecurityIdToTickerSymbol } from "~/components/Positions";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { DashboardProps, InvestmentResponse } from "../../types/index";
import investmentStyles from './../../styles/investment.css';

export const links: LinksFunction = () => {

	return [
		{ rel: "stylesheet", href: investmentStyles }
	];

};
export const loader: LoaderFunction = async () => {

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

	return json(
		{ balances, holdings, securities },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const IndividualInvestmentInformation = () => {
	const { balances, holdings, securities } = useLoaderData<DashboardProps>();
	const params = useParams();
	const securityId = params.holding ?? "";

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);
	const tickerSymbol = securityIdToTickerSymbol[securityId] ?? "Not Found";

	const accountIdToHolding = holdings
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

	return (
        <div className="investment">
			<h1>Accounts Holding {tickerSymbol}</h1>

			{
			Object.keys(accountIdToHolding).map(accountId => {
				return (
					<Link key={accountId} to={`/account/${accountId}`}>
						<p>{getAccountNameById(accountId)}: {accountIdToHolding[accountId]} shares</p>
					</Link>)
				})
			}
		</div>
	);

};

export default IndividualInvestmentInformation;
