import { Holding, Security } from 'plaid';
import { dollarFormatter } from '~/formatters';

export const Investments = (props: { securities: Security[]; investments: Holding[] }) => {
	const { securities, investments } = props;

	const securityIdToTickerSymbol = securities.reduce((acc, curr) => {
		return {
			...acc,
			[curr.security_id]: curr.ticker_symbol
		};
	}, {})

    const totalInvested = investments.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<div className='investment'>
			<h1>Investment Information</h1>

			<h2>You have {dollarFormatter.format(totalInvested)} invested</h2>

			<h2>Your investments are</h2>

			{
				investments.map(holding => <LineItem
					securityMap={securityIdToTickerSymbol}
					totalInvested={totalInvested}
					holding={holding}
				/>)
			}

		</div>
	);
};

const LineItem = (props: {
	totalInvested: number,
	securityMap: Record<string, string>,
	holding: Holding
}) => {

	const { securityMap, totalInvested, holding } = props;
	const percentageOfAllFunds = (holding.institution_value / totalInvested * 100);
	const threshold = 10;
	const color = percentageOfAllFunds >= threshold ? 'red' : '';

	return <p className={color}>You own <strong>{holding.quantity.toFixed(2)}</strong> shares of <strong>{securityMap[holding.security_id] ?? "Not Found"}</strong> at a total value of <strong>{dollarFormatter.format(holding.institution_value)}</strong> representing {percentageOfAllFunds.toFixed(2)}% of your portfolio</p>

};
