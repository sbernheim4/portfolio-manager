import { isAfter, isToday } from "date-fns";
import { AccountBase } from "plaid";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionFunction, Form, json, LinksFunction, LoaderFunction, useActionData, useLoaderData, useSubmit } from "remix";

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

type AccountIdsAndNames = Array<{ accountId: string; name: string; }>;

type NetworthLoaderData = {
	todaysBalance: number;
	balances: Array<AccountBase>;
	accountIdsAndNames: AccountIdsAndNames
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
	const [accountIdsAndNames, todaysBalanceData] = NetworthHelpers.getPerAccountBalancesForToday(balances);

	const mergedAccountBalancesChartData = mergeHistoricalAndTodaysBalanceData(
		// @ts-ignore
		accountBalancesChartData,
		todaysBalance,
		todaysBalanceData
	);

	return json({
		accountBalancesChartData: mergedAccountBalancesChartData,
		todaysBalanceData,
		accountIdsAndNames,
		balances,
		todaysBalance
	});
};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");

	switch (action) {
		case "saveBalance":
			const balance = parseFloat(formData.get("totalBalance") as string);
			const accountRecords = JSON.parse(formData.get("accountsBalance") as string) as Record<string, number>;

			// Fire and forget
			saveAccountBalancesToDB(accountRecords, balance);

			return null;
		case "filterBalanceChart":

			const balances = filterForInvestmentAccounts(await getPlaidAccountBalances());
			const [accountIdsAndNames] = NetworthHelpers.getPerAccountBalancesForToday(balances);

			let accountNamesToInclude = [] as Array<string>;

			for (const pair of formData) {
				const accountName = pair[0]
				const isOn = pair[1] === "on";
				if (isOn) {
					accountNamesToInclude.push(accountName);
				}

			}

			accountIdsAndNames.filter(x => accountNamesToInclude.includes(x.name))

			const foo = accountNamesToInclude.map(accountName => {

				const res = accountIdsAndNames.find(x => x.name === accountName);
				const accountId = res?.accountId

				if (accountId) {
					return {
						accountId,
						name: accountName
					}
				} else {
					return false;
				}

			}).filter(x => x !== false);

			return {
				accountNamesToInclude: foo as AccountIdsAndNames
			};


		default:
			return null

	}

};

const Networth = () => {
	const {
		accountBalancesChartData,
		accountIdsAndNames,
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

	const x = useActionData<{ accountNamesToInclude: AccountIdsAndNames }>();
	const accountNamesToInclude = x?.accountNamesToInclude;

	const [accountsToShow, setAccountsToShow] = useState(accountIdsAndNames);

	const handleClick = () => {
		const checkBoxes = document.querySelectorAll('input[type=checkbox]');
		const checkedValues = Array.from(checkBoxes).filter(el => el.checked).map(el => el.name);
		const allUnchecked = Array.from(checkBoxes).reduce((acc, curr) => acc && !curr.checked, true)

		const updatedAccountIdsToShow = allUnchecked ?
			accountIdsAndNames :
			accountIdsAndNames.filter(x => checkedValues.includes(x.name));

		setAccountsToShow(updatedAccountIdsToShow);

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
						<input type="hidden" name="_action" value="saveBalance" readOnly />
					</Form> :
					null
			}

			<br />
			<div className="networth__chart">

				<>
					<h4>Accounts To Display</h4>
					<Form method="post">
						{accountIdsAndNames.map(entry => {
							return (
								<div className="networth__chart__checkbox-container" key={entry.accountId}>
									<input
										name={entry.name}
										value="on"
										onClick={handleClick}
										id={entry.name}
										type="checkbox"
									/>
									<label htmlFor={entry.name}>{entry.name}</label>
								</div>
							);
						})}

						<input name="_action" value="filterBalanceChart" type="hidden" />

						{
							!isClientSideJSEnabled() ?
								<input type="submit" value="submit" /> :
								null
						}
					</Form>
				</>
				<br />

				<AreaChart width={500} height={250} margin={{ left: 50, top: 30 }} data={accountBalancesChartData}>

					<CartesianAxis />

					<XAxis dataKey="date" />

					<YAxis domain={[0, 'dataMax']} />

					<Tooltip formatter={tooltipFormatter} />

					<Area type="monotone" fillOpacity={.5} name={"Total Balance"} dataKey="totalBalance" />

					{(accountNamesToInclude ?? accountsToShow ?? accountIdsAndNames).map((accountInfo, index) => {
						return <Area
							type="monotone"
							fillOpacity={.5}
							fill={COLORS[index % COLORS.length]}
							stroke={COLORS[index % COLORS.length]}
							name={accountInfo.name}
							key={accountInfo.accountId}
							dataKey={accountInfo.accountId}
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
