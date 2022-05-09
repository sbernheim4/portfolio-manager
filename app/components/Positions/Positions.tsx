import { Holding, Security } from 'plaid';
import { LinksFunction } from "@remix-run/node";
import positionsStyles from './styles/positions.css';
import {
	StockInvestmentSummary,
	links as stockInvestmentSummaryStyles
} from '~/components/StockInvestmentSummary/StockInvestmentSummary';
import { StockPieChart, links as StockPieChartStyles } from './StockPieChart/StockPieChart';
import { dollarFormatter } from '~/helpers/formatters';
import { useSearchableList } from '~/hooks/useSearchHoldings';
import { Option } from 'excoptional';

export const links: LinksFunction = () => {
	return [
		...StockPieChartStyles(),
		...stockInvestmentSummaryStyles(),
		{ rel: "stylesheet", href: positionsStyles }
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


	const consolidateHolding = (
		holdingList: Holding[],
		holding: Holding,
		entryIndex: number
	) => {

		const existingHoldingEntry = holdingList[entryIndex];

		const updatedHoldingEntry: Holding = {
			...holding,
			quantity: existingHoldingEntry.quantity + holding.quantity,
			institution_value: existingHoldingEntry.institution_value + holding.institution_value,
			// TODO: Need to figure out how to calculate the cost basis across all accounts that
			// hold this security
			// cost_basis:
		};

		// Remove the existing holding entry from the list - it will be replaced
		// by `updatedHoldingEntry`
		const cleanedHoldingArray = [
			...holdingList.slice(0, entryIndex),
			...holdingList.slice(entryIndex + 1)
		];

		return [
			updatedHoldingEntry,
			...cleanedHoldingArray
		];

	};

	const mergedHoldings = holdings.reduce((acc, curr) => {

		const currentSecurityId = curr.security_id;
		const entryIndex = acc.findIndex(val => val.security_id === currentSecurityId);
		const securityAlreadyExists = entryIndex !== -1;

		if (!securityAlreadyExists) {
			return [...acc, curr];
		} else {
			return consolidateHolding(acc, curr, entryIndex);
		}

	}, [] as Holding[]);

	return mergedHoldings;

};

export const Positions = (
	props: { securities: Security[]; holdings: Holding[] }
) => {

	const { securities, holdings } = props;

	const tickerSymbolToSecurityId = constructTickerSymbolToSecurityId(
		securities
	);

	// Curried for use in the useSearchHoldings hook
	const toMatchedSecurityIds = (searchTerm: string) => Object.keys(
		tickerSymbolToSecurityId
	)
		.map(ticker => ticker.toUpperCase()) // Normalize
		.filter(ticker => ticker.includes(searchTerm)) // Filter
		.map(ticker => tickerSymbolToSecurityId[ticker]); // convert tickers to security id

	// Note: A single stock can be held in multiple accounts. Plaid
	// (correctly) returns the stock per each account that holds it. This
	// means that if the same stock is held in two accounts, it will appear
	// twice in the holdings list. We don't care about that however as we're
	// focused on the total investment risk NOT the risk of each account.
	// To dedupe these, we use this helper aggregateHoldings function
	const aggregatedHoldings = aggregateHoldings(holdings);

	const [searchTerm, setSearchTerm, holdingsToDisplay] = useSearchableList(
		aggregatedHoldings,
		(searchTerm: string) => (holding: Holding) => toMatchedSecurityIds(searchTerm).includes(holding.security_id),
	);

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(
		securities
	);

	const totalInvested = aggregatedHoldings.reduce((acc, curr) => acc + curr.institution_value, 0);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value.toUpperCase());
	};

	return (
		<div className="positions">
			<h1>Your Positions</h1>

			<h3>Balance: {dollarFormatter.format(totalInvested)}</h3>

			<input
				className="positions__search"
				value={searchTerm}
				onChange={(e) => handleSearch(e)}
				name="search"
				type="search"
				placeholder="Search by ticker"
			/>

			<table className="investment-line-items">
				<thead>
					<tr>
						<th>Ticker</th>
						<th>Quantity (shares)</th>
						<th>Percentage</th>
						<th>Dollar Value</th>
						<th>Above Threshold</th>
					</tr>
				</thead>
				<tbody>
					{
						holdingsToDisplay
							.sort((a, b) => b.institution_value - a.institution_value)
							.map((holding, i) => {

								const ticker = Option.of(securityIdToTickerSymbol[holding.security_id] as string | undefined);

								return (
									<StockInvestmentSummary
										tickerOpt={ticker}
										totalInvested={totalInvested}
										holding={holding}
										key={securities[i].security_id}
									/>
								);
							})
					}
				</tbody>
			</table>

			<StockPieChart
				securityIdToTickerSymbol={securityIdToTickerSymbol}
				holdings={aggregatedHoldings}
			/>

		</div>
	);
};
