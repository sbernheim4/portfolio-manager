import { Holding, Security } from 'plaid';
import { Link } from 'remix';
import { decimalFormatter, dollarFormatter, percentageFormatter } from '~/formatters';

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

export const Investments = (props: { securities: Security[]; holdings: Holding[] }) => {

	const { securities, holdings } = props;

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);


	// Note: A single stock can be held in multiple accounts. Plaid (correctly) returns the stock
	// per each account that holds it. We don't care about that however as we're focused on the
	// aggregate investment risk NOT on the per account risk.
	const aggregatedPositions = aggregateHoldings(holdings);
    const totalInvested = aggregatedPositions.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<div className="investments">
			<h1>Your Portfolio</h1>

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

const StockInvestmentSummary = (props: {
	totalInvested: number,
	holding: Holding,
	ticker: string | null
}) => {

	const { totalInvested, holding, ticker } = props;

	const percentageOfAllFunds = (holding.institution_value / totalInvested);
	const threshold = .1;
	const aboveThreshold = percentageOfAllFunds >= threshold;

	const quantity = decimalFormatter.format(holding.quantity);
	const percentage = percentageFormatter.format(percentageOfAllFunds);

	return (
		<Link to={`/holding/${holding.security_id}`}>
			<div className="investment-line-item">
				<WarningSign aboveThreshold={aboveThreshold}/>

				<h4 className="investment-line-item__ticker">{ticker ?? "N/A"}</h4>
				<p className="investment-line-item__share">{quantity} share(s)</p>
				<p className="investment-line-item__percentage">{percentage} of your portfolio</p>
				<p className="investment-line-item__dollars">{dollarFormatter.format(holding.institution_value)}</p>
			</div>
		</Link>
	);
};

const WarningSign = (props: { aboveThreshold: boolean }) => {
	return !props.aboveThreshold ? null : <p className="investment-line-item__warning-symbol">⚠️</p>
};
