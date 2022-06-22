import stockInvestmentSummaryStyles from "./styles/stockInvestmentSummary.css";
import { Holding } from "plaid";
import { Link } from "@remix-run/react";
import { LinksFunction } from "@remix-run/node";
import { Option } from "excoptional";
import { WarningSign } from "~/components/WarningSign";
import { decimalFormatter, dollarFormatter, percentageFormatter } from "~/helpers/formatters";
import { useWindowSize } from "~/hooks/useWindowSize";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: stockInvestmentSummaryStyles }
	];
};

export const StockInvestmentSummary = (props: {
	totalInvested: number,
	holding: Holding,
	tickerOpt: Option<string>,
	securityId: string
}) => {

	const { totalInvested, holding, tickerOpt } = props;
	const { width } = useWindowSize();

	const percentageOfAllFunds = (holding.institution_value / totalInvested);
	const threshold = .1;

	// Fallback to displaying the security id if no ticker is available
	const ticker = tickerOpt.getOrElse(props.securityId)
	const quantity = decimalFormatter.format(holding.quantity);
	const percentage = percentageFormatter.format(percentageOfAllFunds);
	const aboveThreshold = percentageOfAllFunds >= threshold;

	const row = (
		<>
			<td className="investment-line-item__ticker">{ticker}</td>
			<td className="investment-line-item__share">{quantity}</td>
			<td className="investment-line-item__percentage">{percentage}</td>
			<td className="investment-line-item__dollars">{dollarFormatter.format(holding.institution_value)}</td>
			{!!width && width > 480 ? <td><WarningSign aboveThreshold={aboveThreshold} /></td> : <></> }
		</>
	);

	const linkRow = (ticker: string) => {
		return <Link className="investment-line-item-link" to={`/investments/${ticker}`}>{row}</Link>;
	};

	return <tr className="investment-line-item">{tickerOpt.map(ticker => linkRow(ticker)).getOrElse(row)}</tr>

};
