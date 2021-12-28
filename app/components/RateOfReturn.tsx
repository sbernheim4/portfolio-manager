import { Finance } from "financejs";
import { InvestmentTransaction } from "plaid";

export const RateOfReturn = (props: {
	investmentTransactions: InvestmentTransaction[];
	cashflows: [number[], Date[]];
}) => {

	// const { cashflows } = props;

	// let finance = new Finance();
	// @ts-ignore
	// const XIRR = finance.XIRR(cashflows[0], cashflows[1]);


	return (
		<>
			<h1>hello world</h1>
		</>
	);

};

