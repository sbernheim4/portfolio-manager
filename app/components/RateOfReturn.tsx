import { xirr } from "@webcarrot/xirr";


import { InvestmentTransaction } from "plaid";

export const RateOfReturn = (props: {
	investmentTransactions: InvestmentTransaction[];
	cashflows: [number[], string[]];
}) => {

	const { cashflows } = props;
	const [flows, dates] = cashflows;
	const data = flows.map((flow, index) => {
		return {
			amount: flow,
			date: new Date(dates[index])
		}
	});
	/*
	 * The first value in the array must have a negative value representing the
	 * purchase (aka cost) of the investment. This could be the size of the
	 * portfolio on day 0.
	 * 	> what is day 0? - The first day the user signs up? The initial purcahse
	 * 	date - how is this found?
	 *
	 * Positive values are for payments - additional purchases of shares or an
	 *   increase in position
	 *
	 * Negative values are for costs - sell orders or a decrease in your
	 *   position
	 */
	const data2 = [
		{
			amount: -97,
			date: new Date(2021, 0, 1)
		},
		{
			amount: 1000,
			date: new Date(2021, 1, 2)
		},
		{
			amount: 200,
			date: new Date(2021, 2, 3)
		},
		{
			amount: 400,
			date: new Date(2021, 3, 4)
		},
		{
			amount: 600,
			date: new Date(2021, 4, 5)
		},
		{
			amount: 27,
			date: new Date(2021, 5, 6)
		},
		{
			amount: 10,
			date: new Date(2021, 6, 7)
		},
	];

	const xirrResult = xirr(data2);

	return (
		<>
			<h1>val: {xirrResult}</h1>
			<h1>hello world</h1>
		</>
	);

};

