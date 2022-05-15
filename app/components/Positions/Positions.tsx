import { Holding, Security } from 'plaid';
import { LinksFunction } from "@remix-run/node";
import positionsStyles from './styles/positions.css';
import {
	links as stockInvestmentSummaryStyles
} from '~/components/StockInvestmentSummary/StockInvestmentSummary';
import { StockPieChart, links as StockPieChartStyles } from './StockPieChart/StockPieChart';
import { PositionsTable } from './PositionsTable';

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

		const tickerSymbol = curr.ticker_symbol ?? undefined;

		return {
			...acc,
			[curr.security_id]: tickerSymbol
		};

	}, {} as Record<string, string | undefined>);

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

	// Note: A single stock can be held in multiple accounts. Plaid
	// (correctly) returns the stock per each account that holds it. This
	// means that if the same stock is held in two accounts, it will appear
	// twice in the holdings list. We don't care about that however as we're
	// focused on the total investment risk NOT the risk of each account.
	// To dedupe these, we use this helper aggregateHoldings function
	const aggregatedHoldings = aggregateHoldings(holdings);

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(
		securities
	);

	return (
		<div className="positions">
			<h1>Your Positions</h1>

			<PositionsTable securities={securities} holdings={holdings}/>

			<StockPieChart
				securityIdToTickerSymbol={securityIdToTickerSymbol}
				holdings={aggregatedHoldings}
			/>
		</div>
	);
};
