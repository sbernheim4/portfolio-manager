import { Holding, Security } from 'plaid';
import { Form, LinksFunction } from 'remix';
import { dollarFormatter } from '~/helpers/formatters';
import { isClientSideJSEnabled } from '~/helpers/isClientSideJSEnabled';
import { useSearchHoldings } from '~/hooks/useSearch';
import { StockInvestmentSummary, links as stockInvestmentSummaryStyles } from './StockInvestmentSummary/StockInvestmentSummary';

export const links: LinksFunction = () => {
	return [
		...stockInvestmentSummaryStyles()
	];
};

export const constructTickerSymbolToSecurityId = (securities: Array<Security>) => {

	const tickerSymbolToSecurityId = securities.reduce((acc, curr) => {

		return curr.ticker_symbol ?
			{
				...acc,
				[curr.ticker_symbol]: curr.security_id
			} :
			acc;

	}, {} as Record<string, string>);

    return tickerSymbolToSecurityId;

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

export const aggregateHoldings = (holdings: Holding[]) => {

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

	const tickerSymbolToSecurityId = constructTickerSymbolToSecurityId(securities);

	const toMatchedSecurityIds = (searchTerm: string) => Object.keys(tickerSymbolToSecurityId)
		.map(ticker => ticker.toUpperCase()) // Normalize
		.filter(ticker => ticker.includes(searchTerm)) // Filter
		.map(ticker => tickerSymbolToSecurityId[ticker]); // Ticker -> Security ID

	const [searchTerm, setSearchTerm, holdingsToDisplay] = useSearchHoldings(
		holdings,
		(searchTerm: string) => (holding: Holding) => toMatchedSecurityIds(searchTerm).includes(holding.security_id),
	);

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);

	// Note: A single stock can be held in multiple accounts. Plaid (correctly) returns the stock
	// per each account that holds it. We don't care about that however as we're focused on the
	// aggregate investment risk NOT on the per account risk.
	const aggregatedPositions = aggregateHoldings(holdingsToDisplay);
    const totalInvested = aggregatedPositions.reduce((acc, curr) => acc + curr.institution_value, 0);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value.toUpperCase());
	};

	return (
		<div>
			<h1>Your Positions</h1>

			<h2>Balance: {dollarFormatter.format(totalInvested)}</h2>

			<h2>Your Investments</h2>

			{
				/* Client side searching when JS is enabled */
				isClientSideJSEnabled() ?
					<input
						value={searchTerm}
						onChange={(e) => handleChange(e)}
						name="search"
						type="search"
						placeholder="Search by ticker"
					/>  :
					null
			}

			{/* Server side searching when JS is disabled */}
			<noscript>
				<Form method="post">
					<input name="search" type="search" placeholder="Search by ticker -- NO JS"/>
				</Form>
			</noscript>

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
