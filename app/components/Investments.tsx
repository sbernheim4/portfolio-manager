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

export const Investments = (props: { securities: Security[]; investments: Holding[] }) => {
	const { securities, investments } = props;

	const securityIdToTickerSymbol = constructSecurityIdToTickerSymbol(securities);

    const totalInvested = investments.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<div className="investments">
			<h1>Investment Information</h1>

			<h2>Balance {dollarFormatter.format(totalInvested)}</h2>
			<h2>Your Investments</h2>

			<div className="investment-line-items">
			{
				investments.reverse().map((holding, i) => {
					return (
						<LineItem
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

const LineItem = (props: {
	totalInvested: number,
	holding: Holding,
	ticker: string | null
}) => {

	const { totalInvested, holding } = props;

	const percentageOfAllFunds = (holding.institution_value / totalInvested);
	const threshold = .1;
	const aboveThreshold = percentageOfAllFunds >= threshold;

	const quantity = decimalFormatter.format(holding.quantity);
	const percentage = percentageFormatter.format(percentageOfAllFunds);

	return (
		<Link to={holding.security_id} state={{ holding }}>
			<div className="investment-line-item">
				<WarningSign aboveThreshold={aboveThreshold}/>

				<h4 className="investment-line-item__ticker">{props.ticker ?? "QQQQQQ"}</h4>
				<p className="investment-line-item__share">{quantity} share(s)</p>
				<p className="investment-line-item__percentage">{percentage} of your portfolio</p>
				<p className="investment-line-item__dollars">{dollarFormatter.format(holding.institution_value)}</p>
			</div>
		</Link>
	);
};

const WarningSign = (props: { aboveThreshold: boolean }) => {
	if (!props.aboveThreshold) {
		return null;
	}

	return (
		<p className="investment-line-item__warning-symbol">⚠️</p>
	);
}
