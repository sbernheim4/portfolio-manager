import { xirr } from "@webcarrot/xirr";
import { InvestmentTransaction } from "plaid";

export const RateOfReturn = (props: {
	investmentTransactions: InvestmentTransaction[];
	cashflowData: [number[], string[]];
}) => {

	const { cashflowData } = props;
	const [cashflows, dates] = cashflowData;

	const data = cashflows.map((flow, index) => {
		return {
			amount: flow,
			date: new Date(dates[index])
		}
	});

	const xirrResult = xirr(data);

	return (
		<>
			<h1>XIRR: {xirrResult}</h1>
		</>
	);

};

