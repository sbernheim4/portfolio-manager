import { Holding, Security } from 'plaid';
import { LinksFunction } from 'remix';
import { dollarFormatter } from '~/helpers/formatters';
import { StockInvestmentSummary, links as stockInvestmentSummaryStyles } from './StockInvestmentSummary';

export const links: LinksFunction = () => {
	return [
		...stockInvestmentSummaryStyles()
	];
};

export const constructSecurityIdToTickerSymbol = (securities: Array<Security>) => {

	const securityIdToTickerSymbol = securities.reduce((acc, curr) => {

		return {
			...acc,
			[curr.security_id]: curr.ticker_symbol
		};

	}, {} as Record<string, string | null>);

    return securityIdToTickerSymbol;

};

const aggregateHoldings = (holdings: Holding[]) => {

	const mergedHoldings = holdings.reduce((acc, curr) => {

		const currentSecurityId = curr.security_id;
		const entryIndex = acc.findIndex(val => val.security_id === currentSecurityId);
		const securityAlreadyExists = entryIndex !== -1;

		if (!securityAlreadyExists) {
			return [...acc, curr];
		}

		// Merge the existing entry for a given symbol and the current entry for the same symbol
		const existingEntry = acc[entryIndex];

		const newEntry: Holding = {
			...curr,
			quantity: existingEntry.quantity + curr.quantity,
			institution_value: existingEntry.institution_value + curr.institution_value,
			// TODO: Need to figure out how to calculate the cost basis across all accounts that
			// hold this security
			// cost_basis:
		};

		const newArr = [...acc.slice(0, entryIndex), ...acc.slice(entryIndex + 1)];

		return [...newArr, newEntry];

	}, [] as Holding[]);

	return mergedHoldings;

};

export const Positions = (props: { securities: Security[]; holdings: Holding[] }) => {

	const { securities, holdings } = props;

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);


	// Note: A single stock can be held in multiple accounts. Plaid (correctly) returns the stock
	// per each account that holds it. We don't care about that however as we're focused on the
	// aggregate investment risk NOT on the per account risk.
	const aggregatedPositions = aggregateHoldings(holdings);
    const totalInvested = aggregatedPositions.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<div>
			<h1>Your Positions</h1>

			<h2>Balance: {dollarFormatter.format(totalInvested)}</h2>

			<h2>Your Investments</h2>

				<div className="investment-line-items">
				{
					aggregatedPositions.reverse().map((holding, i) => {
						return (
							<StockInvestmentSummary
								ticker={securityIdToTickerSymbol[holding.security_id]}
								totalInvested={totalInvested}
								holding={holding}
								key={securities[i].security_id}
							/>
						);
					})
				}
				</div>
		</div>
	);
};
