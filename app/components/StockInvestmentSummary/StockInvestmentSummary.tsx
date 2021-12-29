import { Holding } from "plaid";
import { Link, LinksFunction } from "remix";
import { decimalFormatter, dollarFormatter, percentageFormatter } from "~/helpers/formatters";
import { WarningSign } from "./../WarningSign";
import stockInvestmentSummaryStyles from "./stockInvestmentSummary.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: stockInvestmentSummaryStyles }
	];
};

export const StockInvestmentSummary = (props: {
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
		<tr className="investment-line-item">
			<Link className="investment-line-item-link" to={`/positions/${holding.security_id}`}>

				<td className="investment-line-item__ticker">{ticker ?? "N/A"}</td>
				<td className="investment-line-item__share">{quantity}</td>
				<td className="investment-line-item__percentage">{percentage}</td>
				<td className="investment-line-item__dollars">{dollarFormatter.format(holding.institution_value)}</td>
				<td><WarningSign aboveThreshold={aboveThreshold} /></td>
			</Link>
		</tr>
	);
};
