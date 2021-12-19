import { Holding } from "plaid";
import { Link } from "remix";
import { decimalFormatter, dollarFormatter, percentageFormatter } from "~/formatters";
import { WarningSign } from "./WarningSign";

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