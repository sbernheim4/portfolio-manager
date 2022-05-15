import { Option } from "excoptional";
import { Holding, Security } from "plaid";
import { useSearchableList } from "~/hooks/useSearchHoldings";
import { StockInvestmentSummary } from "./StockInvestmentSummary/StockInvestmentSummary";
import { aggregateHoldings, constructSecurityIdToTickerSymbol, constructTickerSymbolToSecurityId } from "./Positions";

export const PositionsTable = (
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
		<div>

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
						<th>Quantity</th>
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

								const ticker = Option.of(securityIdToTickerSymbol[holding.security_id]);

								return (
									<StockInvestmentSummary
										tickerOpt={ticker}
										totalInvested={totalInvested}
										holding={holding}
										securityId={securities[i].security_id}
									/>
								);
							})
					}
				</tbody>
			</table>

		</div>
	);
};
