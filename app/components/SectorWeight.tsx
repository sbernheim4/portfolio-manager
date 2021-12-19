import { Holding, Security } from "plaid";
import { dollarFormatter, percentageFormatter } from "~/helpers/formatters";

export const SectorWeight = (props: { securities: Security[], holdings: Holding[]}) => {

	const { securities, holdings } = props;

	const securityIdToType  = securities.reduce((acc, curr) => {

		return {
			...acc,
			[curr.security_id]: curr.type
		};

	}, {} as Record<string, string | null>);

	const investmentTypeToValueForThatType = holdings.reduce((acc, curr) => {
		const securityId = curr.security_id;
		const type = securityIdToType[securityId];

		if (!type) {
			return acc;
		}

		const exists = acc[type];

		const amount = !!exists ?
			curr.institution_value + exists :
			curr.institution_value;

		return {
			...acc,
			[type]: amount
		};

	}, {} as Record<string, number>);

	const totalInvested = holdings.reduce((acc, curr) => acc + curr.institution_value, 0);

	return (
		<>
			<h1>Portfolio by Weights</h1>

			<h3>Weights by Type</h3>
			{
				Object.keys(investmentTypeToValueForThatType).map(type => {

					const dollarAmount = dollarFormatter.format(investmentTypeToValueForThatType[type]);
					const percentage = investmentTypeToValueForThatType[type] / totalInvested;

					return <p>{type}: {dollarAmount} - {percentageFormatter.format(percentage)}</p>
				})
			}

			<h3>Weights by Sector</h3>

			{/* TODO: Find an API or download data of security --> Sector */}
			{/* Might need to use polygon.io --> Free api keys */}

		</>
	);

};
