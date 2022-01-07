import { isAfter, isToday } from "date-fns";
import { AccountBase } from "plaid";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianAxis, Tooltip, XAxis, YAxis } from "recharts";
import { ActionFunction, Form, json, LinksFunction, LoaderFunction, useLoaderData, useSubmit } from "remix";

import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { COLORS } from "~/components/Positions/StockPieChart/StockPieChart";
import { saveAccountBalancesToDB } from "~/helpers/db";
import { dollarFormatter } from "~/helpers/formatters";
import { isClientSideJSEnabled } from "~/helpers/isClientSideJSEnabled";
import * as NetworthHelpers from "~/helpers/networthRouteHelpers";
import { filterForInvestmentAccounts, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { validateUserIsLoggedIn } from "~/helpers/validateUserIsLoggedIn";
import networthStyles from "~/styles/networth/networth.css";

export type AccountBalanceChartData = Array<{
	[key: string]: number;
	// @ts-ignore
	date: string;
	totalBalance: number;
}>

type NetworthLoaderData = {
	todaysBalance: number;
	balances: Array<AccountBase>;
	accountIdsToName: Array<{ accountId: string; name: string; }>;
	todaysBalanceData: Record<string, number>;
	accountBalancesChartData: AccountBalanceChartData
};

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: networthStyles }
	];
};

const mergeHistoricalAndTodaysBalanceData = (
	historicalBalanceData: AccountBalanceChartData,
	todaysBalance: number,
	todaysBalanceData: Record<string, number>
) => {

	const lastEntry = historicalBalanceData[historicalBalanceData.length - 1];
	const noEntriesExist = lastEntry === undefined;

	if (noEntriesExist) {

		return [{
			date: new Date().toISOString(),
			totalBalance: todaysBalance,
			...todaysBalanceData
		}];
	}

	const lastEntryDate = new Date(lastEntry.date);

	return isToday(lastEntryDate) ?
		historicalBalanceData :
		[
			...historicalBalanceData,
			{
				date: new Date().toISOString(),
				totalBalance: todaysBalance,
				...todaysBalanceData
			}
		];

};

export const loader: LoaderFunction = async ({ request }) => {

	const accountBalancesChartData = await NetworthHelpers.getHistoricalPerAccountBalances();
	const balances = filterForInvestmentAccounts(await getPlaidAccountBalances());

	const todaysBalance = NetworthHelpers.calculateTodaysTotalBalance(balances);
	const [accountIdsToName, todaysBalanceData] = NetworthHelpers.getPerAccountBalancesForToday(balances);

	const mergedAccountBalancesChartData = mergeHistoricalAndTodaysBalanceData(
		// @ts-ignore
		accountBalancesChartData,
		todaysBalance,
		todaysBalanceData
	);

	return json({
		accountBalancesChartData: mergedAccountBalancesChartData,
		todaysBalanceData,
		accountIdsToName,
		balances,
		todaysBalance
	});
};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();

	const balance = parseFloat(formData.get("totalBalance") as string);
	const accountRecords = JSON.parse(formData.get("accountsBalance") as string) as Record<string, number>;

	// Fire and forget
	saveAccountBalancesToDB(accountRecords, balance);

	return null;


};

const Networth = () => {
	const {
		accountBalancesChartData,
		accountIdsToName,
		todaysBalanceData,
		todaysBalance,
		balances
	} = useLoaderData<NetworthLoaderData>();

	const submit = useSubmit();

	// Auto Submit today's balance when JS is enabled via useEffect
	// The DB handler takes care of only storing todays balance if it hasn't yet
	// been stored
	useEffect(() => {

		const formData = new FormData();
		formData.set("totalBalance", todaysBalance.toString());
		formData.set("accountsBalance", JSON.stringify(todaysBalanceData));

		submit(formData, { method: "post" });
	}, []);

	const [accountsToShow, setAccountsToShow] = useState(accountIdsToName);
	const [filteredAccountBalancesChartData, setFilteredAccountBalancesChartData] = useState(accountBalancesChartData);

	const handleClick = () => {
		const checkBoxes = document.querySelectorAll('input[type=checkbox]');
		const checkedValues = Array.from(checkBoxes).filter(el => el.checked).map(el => el.name);
		const allUnchecked = Array.from(checkBoxes).reduce((acc, curr) => acc && !curr.checked, true)

		const updatedAccountIdsToShow = allUnchecked ?
			accountIdsToName :
			accountIdsToName.filter(x => checkedValues.includes(x.name));

		setAccountsToShow(updatedAccountIdsToShow);

		// const accountIdsToShow = updatedAccountIdsToShow.map(x => x.accountId);
	};

	return (
		<div className="networth">
			<h1>Your Portfolio Balance</h1>
			<InvestmentAccounts balances={balances} />

			{
				// If JS is disabled allow the user to store the data
				!isClientSideJSEnabled() ?
					<Form>
						<input type="submit" value="Save Balance" />
						<input type="hidden" name="balance" value={todaysBalance} readOnly />
					</Form> :
					null
			}

			<br />
			<div className="networth__chart">

				<>
					<h4>Accounts To Display</h4>
					<Form method="post">
						{accountIdsToName.map(entry => {
							return (
								<div className="networth__chart__checkbox-container" key={entry.accountId}>
									<input value="on" onClick={handleClick} id={entry.name} type="checkbox" name={entry.name} />
									<label htmlFor={entry.name}>{entry.name}</label>
								</div>
							);
						})}

						{
							!isClientSideJSEnabled() ?
								<input type="submit" value="submit" /> :
								null
						}
					</Form>
				</>
				<br />

				<AreaChart margin={{ left: 50, top: 30 }} width={730} height={240} data={filteredAccountBalancesChartData}>

					<CartesianAxis />

					<XAxis dataKey="date" />

					<YAxis domain={['dataMin', 'dataMax']} />

					<Tooltip formatter={tooltipFormatter} />

					<Area type="monotone" fillOpacity={.5} name={"Total Balance"} dataKey="totalBalance" />

					{accountsToShow.map((acc, index) => {
						return <Area
							type="monotone"
							fillOpacity={.5}
							fill={COLORS[index % COLORS.length]}
							stroke={COLORS[index % COLORS.length]}
							name={acc.name}
							key={acc.accountId}
							dataKey={acc.accountId}
						/>
					})}

				</AreaChart>
			</div>

		</div>
	);

};

const tooltipFormatter = (dollarAmount: number) => {
	return dollarFormatter.format(dollarAmount);
};

export default Networth;