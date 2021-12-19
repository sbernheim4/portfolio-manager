import { AccountBase } from "plaid";
import { json, LoaderFunction, useLoaderData } from "remix";
import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { DashboardProps, InvestmentResponse } from "../../types/index";

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
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const Accounts = () => {
    const investmentData = useLoaderData<DashboardProps>();

	const {balances, securities, holdings} = investmentData;

	return (
		<div className="accounts">
			<InvestmentAccounts balances={balances} securities={securities} holdings={holdings}/>
		</div>
	);
};

export default Accounts;
