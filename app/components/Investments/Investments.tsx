import { Holding } from 'plaid';

export const Investments = (props: { investments: Holding[] }) => {
	const { investments } = props;

    const totalInvested = investments.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<div className='investment'>
			<h1>Investment Information</h1>
			<br />

			<h2>You have ${totalInvested.toFixed(2)} invested</h2>
			<br />

			<h2>Your investments are</h2>
			{
				investments.map(x => <LineItem totalInvested={totalInvested} holding={x}/>)
			}
		</div>
	)
}

const LineItem = (props: {
	totalInvested: number,
	holding: Holding
}) => {

	const { totalInvested, holding } = props;
	const percentageOfAllFunds = (holding.institution_value / totalInvested * 100);
	const threshold = 10;
	const color = percentageOfAllFunds >= threshold ? 'red' : '';

	const dollarFormatter = Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});

	return <p className={color}>You own {holding.quantity.toFixed(2)} shares at a total value of ${dollarFormatter.format(holding.institution_value)} representing {percentageOfAllFunds.toFixed(2)}% of your portfolio</p>

};
