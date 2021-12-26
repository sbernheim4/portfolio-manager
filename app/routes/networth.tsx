import { format } from "date-fns";
import { AccountBase } from "plaid";
import { useEffect } from "react";
import { CartesianAxis, Line, LineChart, XAxis, YAxis } from "recharts";
import { ActionFunction, Form, json, LinksFunction, LoaderFunction, useLoaderData, useSubmit } from "remix";
import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { positiveAccountTypes } from "~/components/NetworthComponent";
import { getNetworthFromDb, saveNetworthToDB } from "~/helpers/db";
import { isClientSideJSEnabled } from "~/helpers/isClientSideJSEnabled";
import { filterForInvestmentAccounts, getPlaidAccountBalances } from "~/helpers/plaidUtils";

type LoaderResponse = {
	balances: Array<Record<string, number>>;
	todaysBalance: number;
	accountBase: Array<AccountBase>;
};

export const links: LinksFunction = () => {
	return [
	];
};

export const loader: LoaderFunction = async () => {
	const accountBase = filterForInvestmentAccounts(await getPlaidAccountBalances());

	const currentAccountBalances = accountBase
		.reduce((acc, curr) => {
			const isPositive = positiveAccountTypes.includes(curr.type);
			return isPositive ?
				acc + (curr.balances.current ?? 0) :
				acc - (curr.balances.current ?? 0)
		}, 0);

	const balances = await getNetworthFromDb();
	const formattedBalances = balances.map(dataPoint => {
		return {
			date: format(new Date(dataPoint.date), "MM/dd/yyyy"),
			balances: dataPoint.balances
		};
	});

	return json({
		accountBase,
		balances: formattedBalances,
		todaysBalance: currentAccountBalances
	});
};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const balance = parseFloat(formData.get("balance") as string);

	saveNetworthToDB(balance);

	return null;

};

const Networth = () => {
	const { balances, todaysBalance, accountBase } = useLoaderData<LoaderResponse>();
	const submit = useSubmit();

	// Auto Submit today's balance when JS is enabled via useEffect
	useEffect(() => {
		const formData = new FormData();
		formData.set("balance", todaysBalance.toString());
		submit(formData, { method: "post" });
	}, []);

	return (
		<>
			<h1>Your Portfolio Balance</h1>
			<InvestmentAccounts balances={accountBase} />

			{
				// If JS is disabled allow the user to store the data
				!isClientSideJSEnabled() ?
					<Form method="post">
						<input type="submit" value="Save Balance" />
						<input type="hidden" name="balance" value={todaysBalance} readOnly />
					</Form> :
					null
			}

			<div className="networth__chart">
				<LineChart margin={{ top: 5 }} width={730} height={240} data={balances}>
					<CartesianAxis />
					<XAxis dataKey="date" />
					<YAxis />
					<Line dataKey="balances" />
				</LineChart>
			</div>

		</>
	);

};

export default Networth;
