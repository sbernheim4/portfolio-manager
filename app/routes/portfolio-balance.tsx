import { AccountBase } from "plaid";
import { ActionFunction, json, LinksFunction, LoaderFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Area, AreaChart, CartesianAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { isAfter, isToday } from "date-fns";
import { useEffect, useState } from "react";

import * as NetworthHelpers from "~/helpers/networthRouteHelpers";
import networthStyles from "~/styles/networth/networth.css";
import { AccountIdToValue } from "~/types/UserInfo.types";
import { COLORS } from "~/components/Positions/StockPieChart/StockPieChart";
import { AccountsList } from "~/components/InvestmentAccounts";
import { dollarFormatter } from "~/helpers/formatters";
import { filterForInvestmentAccounts, getPlaidAccountBalances, getPlaidAccounts } from "~/helpers/plaidUtils";
import { getMostRecentAccountBalancesEntryDate, saveAccountBalancesToDB } from "~/helpers/db.server";
import { getUserNameFromSession } from "~/helpers/session";
import { isClientSideJSEnabled } from "~/helpers/isClientSideJSEnabled";
import { validateIsLoggedIn } from "~/remix-helpers";
import { useLoggedIn } from "~/hooks/useLoggedIn";

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

	const noEntriesExist = historicalBalanceData.length === 0;

	// If there are no entries in the historical balance data, then we can just
	// return an array containing one entry.
	//
	// This happens the first time the user visits the page.
	if (noEntriesExist) {
		return [
			{
				date: new Date().toLocaleDateString(),
				totalBalance: todaysBalance,
				...todaysBalanceData
			}
		];
	}

	// Find the most recent entry in the historical data
	let mostRecentEntryDate = new Date(historicalBalanceData[0].date);
	for (let i = 1; i < historicalBalanceData.length; i++) {
		const entry = historicalBalanceData[i];
		const entryDate = new Date(entry.date);

		if (isAfter(entryDate, mostRecentEntryDate)) {
			mostRecentEntryDate = entryDate;
		}
	}

	// Create a new entry for the today (it may not be needed).
	const todaysEntry = {
		date: new Date().toISOString(),
		totalBalance: todaysBalance,
		...todaysBalanceData
	};

	// If the most recent entry is not from today, add today's entry to the end
	// of the array.
	const updatedHistoricalBalanceData = isToday(mostRecentEntryDate) ?
		historicalBalanceData :
		[
			...historicalBalanceData,
			todaysEntry
		];

	// Return the array sorted by date
	return updatedHistoricalBalanceData.sort((a, b) => {
		const dateA = new Date(a.date);
		const dateB = new Date(b.date);

		return isAfter(dateA, dateB) ? 1 : -1;
	});

};

export const loader: LoaderFunction = async ({ request }) => {
	await validateIsLoggedIn(request);

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
		{
			// Data should only be cached by browsers (not shared caches)
			// Valid for 4 hours
			// Stale while revalidate for an additional 8 hours
			headers: { "Cache-Control": "private, max-age=14400, stale-while-revalidate=28800" }
		}
	);
};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");
	const username = await getUserNameFromSession(request);


	switch (action) {
		case 'isLoggedIn':
			await validateIsLoggedIn(request);

		// User clicks to save today's balance information to their historical
		// record.
		case "saveBalance":
			const todaysBalanceData = JSON.parse(formData.get("accountsBalance") as string) as AccountIdToValue
			const totalBalance = parseFloat(formData.get("totalBalance") as string);

			// Fire and forget
			saveAccountBalancesToDB(username, todaysBalanceData, totalBalance);

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

	useLoggedIn();

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
		const checkBoxes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type=checkbox]');
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
			<AccountsList balances={balances} />

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

				<ResponsiveContainer width="100%" height={250}>
					<AreaChart data={accountBalancesChartData}>

						<CartesianAxis />

						<XAxis interval={6} dataKey="date" />

						<YAxis width={85} tickFormatter={(value) => dollarFormatter.format(value)} domain={[0, 'dataMax']} />

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
				</ResponsiveContainer>;

			</div>

		</div>
	);

};

const tooltipFormatter = (dollarAmount: number) => {
	return dollarFormatter.format(dollarAmount);
};

export default Networth;
