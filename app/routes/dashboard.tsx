import { AccountBase, Holding, Security } from "plaid";
import { json, LoaderFunction, Outlet, useLoaderData } from "remix"
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";

export type DashboardProps = {
	balances: AccountBase[];
	holdings: Holding[];
	securities: Security[];
}

export type InvestmentResponse = {
	holdings: Holding[];
	securities: Security[];
}

export const loader: LoaderFunction = async () => {

	const promises: [
		Promise<InvestmentResponse>,
		Promise<Array<AccountBase>>
	] = [
		getInvestmentHoldings(),
		getPlaidAccountBalances()
	];

	const results = await Promise.allSettled(promises);

	// @ts-ignore
	const resolvedPromises: [
		InvestmentResponse,
		AccountBase[]
	] = results
		// @ts-ignore
		.filter(isFilled)
		// @ts-ignore
		.map(x => x.value);

	const [investmentData, balances] = resolvedPromises;

	return json(
		{ ...investmentData, balances },
		{ headers: { "Cache-Control": "max-age=240" } }
	);

};

const DashboardLayoutRoute = () => {
    const investmentData = useLoaderData<DashboardProps>();

	return (
		<>
			<Outlet context={investmentData}/>
		</>
   );

};

export default DashboardLayoutRoute;
