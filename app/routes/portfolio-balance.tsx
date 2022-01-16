import { AccountBase } from "plaid";
import { ActionFunction, Form, json, LinksFunction, LoaderFunction, redirect, useActionData, useLoaderData, useSubmit } from "remix";
import { Area, AreaChart, CartesianAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { isToday } from "date-fns";
import { useEffect, useState } from "react";

import * as NetworthHelpers from "~/helpers/networthRouteHelpers";
import networthStyles from "~/styles/networth/networth.css";
import { AccountIdToValue } from "~/types/UserInfo.types";
import { COLORS } from "~/components/Positions/StockPieChart/StockPieChart";
import { InvestmentAccounts } from "~/components/InvestmentAccounts";
import { dollarFormatter } from "~/helpers/formatters";
import { filterForInvestmentAccounts, getPlaidAccountBalances, getPlaidAccounts } from "~/helpers/plaidUtils";
import { getMostRecentAccountBalancesEntryDate, saveAccountBalancesToDB } from "~/helpers/db";
import { getUserNameFromSession } from "~/helpers/session";
import { isClientSideJSEnabled } from "~/helpers/isClientSideJSEnabled";
import { isLoggedOut } from "./login";

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
	accountBalancesChartData: AccountBalanceChartData;
	mostRecentAccountBalancesEntryDate: string;
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
	if (await isLoggedOut(request)) {
		return redirect("/login");
	}

	const username = await getUserNameFromSession(request);
	const mostRecentAccountBalancesEntryDate = await getMostRecentAccountBalancesEntryDate(username);
	const accountBalancesChartData = await NetworthHelpers.getHistoricalPerAccountBalances(username);
	const balances = filterForInvestmentAccounts(await getPlaidAccountBalances(username));

	const todaysBalance = NetworthHelpers.calculateTodaysTotalBalance(balances);
	const [accountIdsAndNames, todaysBalanceData] = NetworthHelpers.getPerAccountBalancesForToday(balances);

	const mergedAccountBalancesChartData = mergeHistoricalAndTodaysBalanceData(
		accountBalancesChartData,
		todaysBalance,
		todaysBalanceData
	);

	return json(
		{
			mostRecentAccountBalancesEntryDate,
			accountBalancesChartData: mergedAccountBalancesChartData,
			// Used by the client to update the historical info in the DB
			todaysBalanceData,
			// Helper for filtering what charts for accounts to show -
			// checkboxes in the UI display account names but the chart data
			// relies on account ids
			accountIdsAndNames,
			// Provided to the InvestmentAccounts component rendered by this route
			balances,
			todaysBalance
		},
		{ headers: { "Cache-Control": "max-age=43200" } }
	);
};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");
	const username = await getUserNameFromSession(request);


	switch (action) {
		// User clicks to save today's balance information to their historical
		// record.
		case "saveBalance":
			const accountRecords = JSON.parse(formData.get("accountsBalance") as string) as AccountIdToValue
			const totalBalance = parseFloat(formData.get("totalBalance") as string);

			// Fire and forget
			saveAccountBalancesToDB(username, accountRecords, totalBalance);

			return null;
		case "filterBalanceChart":
			// User decides to filter the chart to only show a given set of
			// accounts.

			/*
			 * 1. Construct a list of accounts to include by the account name
			 * based on which checkboxes were checked and included in the form
			 * submission.
			 */
			let accountNamesIncludedInForm = [] as Array<string>;

			for (const pair of formData) {
				const accountName = pair[0]
				const isOn = pair[1] === "on";
				if (isOn) {
					accountNamesIncludedInForm.push(accountName);
				}

			}

			/*
			 * 2. Get all the user's accounts.
			 */
			const accountInfo = await getPlaidAccounts(username);

			/*
			 * 3. Filter to only include the accounts in the constructed list
			 * above.
			 */
			const selectedAccountsFromFormSubmission: AccountIdsAndNames = accountInfo
				.filter(x => accountNamesIncludedInForm.includes(x.name))
				// We can't just return the result of the filter - it's type is
				// AccountBase - which uses the name account_id instead of
				// accountId which is what the client side JS is expecting.
				// The other potential sources only include the accountId and
				// name so we stick to just the data the client needs without
				// over fetching.
				.map(account => {
					return {
						accountId: account.account_id,
						name: account.name
					}
				});

			return { selectedAccountsFromFormSubmission };

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
		balances,
		mostRecentAccountBalancesEntryDate
	} = useLoaderData<NetworthLoaderData>();

	const submit = useSubmit();

	// Auto Submit today's balance when JS is enabled via useEffect
	useEffect(() => {
		if (isToday(new Date(mostRecentAccountBalancesEntryDate))) {
			return;
		}

		const formData = new FormData();
		formData.set("totalBalance", todaysBalance.toString());
		formData.set("accountsBalance", JSON.stringify(todaysBalanceData));
		formData.set("_action", "saveBalance");

		submit(formData, { method: "post" });
	}, []);

	const actionResponse = useActionData<{ selectedAccountsFromFormSubmission: AccountIdsAndNames }>();
	const selectedAccountsFromFormSubmission = actionResponse?.selectedAccountsFromFormSubmission;

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

	const PositionsBalanceChartWithSize = () => {
		return (
			<AreaChart width={800} height={250} margin={{ left: 50, top: 30 }} data={accountBalancesChartData}>

				<CartesianAxis />

				<XAxis interval={1} minTickGap={10} dataKey="date" />

				<YAxis domain={[0, 'dataMax']} />

				<Tooltip formatter={tooltipFormatter} />

				<Area type="monotone" fillOpacity={.5} name={"Total Balance"} dataKey="totalBalance" />

				{(selectedAccountsFromFormSubmission ?? accountsToShow ?? accountIdsAndNames).map((account, index) => {
					return <Area
						type="monotone"
						fillOpacity={.5}
						fill={COLORS[index % COLORS.length]}
						stroke={COLORS[index % COLORS.length]}
						name={account.name}
						key={account.accountId}
						dataKey={account.accountId}
					/>
				})}

			</AreaChart>
		);
	};

	const chart = isClientSideJSEnabled() ?
		<ResponsiveContainer width="100%" height={250}>
			<AreaChart data={accountBalancesChartData}>

				<CartesianAxis />

				<XAxis interval={1} dataKey="date" />

				<YAxis domain={[0, 'dataMax']} />

				<Tooltip formatter={tooltipFormatter} />

				<Area type="monotone" fillOpacity={.5} name={"Total Balance"} dataKey="totalBalance" />

				{
					/* Successively test all 3 versions of the account data to
					 * render into the chart. The order is intended.
					 *
					 * If JS is *disabled* and form is submitted defer to form
					 * result (selectedAccountsFromFormSubmission) above all
					 * else.
					 *
					 * If JS is *enabled*, defer to state variable
					 * (accountsToShow) as this value is connected to the
					 * checkbox click handler.
					 *
					 * If JS is *disabled* AND the form has not yet been
					 * submitted (inital render), defer to loader value
					 * (accountIdsAndNames).
					*/
				}
				{(selectedAccountsFromFormSubmission ?? accountsToShow ?? accountIdsAndNames).map((account, index) => {
					return <Area
						type="monotone"
						fillOpacity={.5}
						fill={COLORS[index % COLORS.length]}
						stroke={COLORS[index % COLORS.length]}
						name={account.name}
						key={account.accountId}
						dataKey={account.accountId}
					/>
				})}

			</AreaChart>
		</ResponsiveContainer> :
		<PositionsBalanceChartWithSize />;

	return (
		<div className="networth">
			<h1>Your Portfolio Balance</h1>
			<InvestmentAccounts balances={balances} />

			{
				// If JS is disabled, allow the user to store today's balances
				// in their history
				// TODO: Could this just be done automatically by the loader?
				!isClientSideJSEnabled() && !isToday(new Date(mostRecentAccountBalancesEntryDate)) ?
					<Form>
						<input type="submit" value="Save Balance" />
						<input type="hidden" name="totalBalance" value={todaysBalance} readOnly />
						<input type="hidden" name="accountsBalance" value={JSON.stringify(todaysBalanceData)} readOnly />
						<input type="hidden" name="_action" value="saveBalance" readOnly />
					</Form> :
					null
			}

			<br />
			<div className="networth__chart">

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

				<br />

				{chart}
			</div>

		</div>
	);

};

const tooltipFormatter = (dollarAmount: number) => {
	return dollarFormatter.format(dollarAmount);
};

export default Networth;
