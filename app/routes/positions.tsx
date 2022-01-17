import { AccountBase, Holding, InvestmentTransaction } from "plaid";
import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction, Outlet, redirect, useActionData, useLoaderData } from "remix";
import { HoldingsSecurities } from '~/types/index';
import { Positions, links as positionStyles, aggregateHoldings, constructTickerSymbolToSecurityId } from "~/components/Positions/Positions";
import { PositionsLoaderData } from "~/types/positions.types";
import { RateOfReturn } from "~/components/RateOfReturn";
import { SectorWeight } from "~/components/SectorWeight";
import { differenceInMonths } from "date-fns";
import { getInvestmentHoldings, getInvestmentTransactions, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getXirrData, updatePositionsLastUpdatedAt } from "~/helpers/db";
import { getUserNameFromSession } from "~/helpers/session";
import { isFilled } from "~/helpers/isFilled";
import { isLoggedOut } from "./login";
import { useCheckInForXIRR } from "~/hooks/useCheckInForXIRR";
import { xirr as calculateXirr } from "@webcarrot/xirr";

export const meta: MetaFunction = () => {
	return {
		title: "Your Investments",
		description: "View your investments across your entire portfolio"
	};
};

export const links: LinksFunction = () => {
	return [
		...positionStyles(),
	];
};

export const getInvestmentsAndAccountBalances = async (username: string) => {
	const promises: [
		Promise<HoldingsSecurities>,
		Promise<Array<AccountBase>>
	] = [
			getInvestmentHoldings(username),
			getPlaidAccountBalances(username)
		];

	const results = await Promise.allSettled(promises);

	// @ts-ignore
	const resolvedPromises: [
		HoldingsSecurities,
		AccountBase[]
	] = results
		// @ts-ignore
		.filter(isFilled)
		// @ts-ignore
		.map(x => x.value);

	const [investmentData, balances] = resolvedPromises;
	const { holdings, securities } = investmentData;

	return {
		balances,
		holdings,
		securities
	};

}

/**
 * Calculate the new XIRR value using the previous XIRR values
 */
const calculateNewXirr = (
	previousXirr: null | number,
	balanceAsOfCheckpointDate: number,
	currentBalance: number,
	checkpointDate: Date,
	transactionsSinceCheckpointDate: InvestmentTransaction[]
) => {

	const today = new Date();

	const cashflowsSinceCheckPointDate = transactionsSinceCheckpointDate.map(tx => {
		return {
			// Need to multiply by -1 since Plaid considers selling shares a
			// positive value (and buying shares a negative) whereas xirr
			// calculates these in the opposite way
			amount: (tx.amount - (tx.fees ?? 0)) * -1,
			date: new Date(tx.date)
		}
	});

	const noPreviousXirr = previousXirr === null;

	if (noPreviousXirr) {

		const xirrValue = calculateXirr([
			{
				amount: balanceAsOfCheckpointDate * -1,
				date: checkpointDate
			},

			...cashflowsSinceCheckPointDate,

			{
				amount: currentBalance,
				date: today
			}
		]);

		return parseFloat(xirrValue.toFixed(4));

	} else {

		// Dates and date related values
		const currentYear = today.getFullYear();
		const startOfYear = new Date(currentYear, 0, 1);
		const monsthsSinceCheckPointDate = differenceInMonths(today, checkpointDate);

		const discountPresentValuePercent = Math.pow((1 + previousXirr), 1 / 12) - 1
		const discountedPresentValue = 1 / Math.pow((1 + discountPresentValuePercent), monsthsSinceCheckPointDate) * balanceAsOfCheckpointDate;

		const newXirr = calculateXirr([
			{ amount: discountedPresentValue * -1, date: startOfYear },
			...cashflowsSinceCheckPointDate,
			{ amount: currentBalance, date: today }
		]);

		return parseFloat(newXirr.toFixed(4));

	}

};

export const loader: LoaderFunction = async ({ request }) => {

	if (await isLoggedOut(request)) {
		return redirect("/login");
	}

	const username = await getUserNameFromSession(request);
	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances(username);

	const {
		xirr: xirrFromDB,
		balance,
		positionsLastUpdatedAt
	} = await getXirrData(username)

	const today = new Date();
	const fetchTransactionsFrom = new Date(positionsLastUpdatedAt || today);

	// Used for calculating XIRR
	// TODO: This may not return all transactions for the given period -- need
	// to add some additional logic in the function to continue looping if there
	// are more transactions than what was requested
	const investmentTransactions = await getInvestmentTransactions(username, fetchTransactionsFrom);

	const todaysInvestmentBalances = balances.reduce((acc, curr) => {
		return curr.type === "investment" || curr.type === "brokerage" ?
			acc + (curr.balances.current ?? 0) :
			acc
	}, 0);

	const newXirr = calculateNewXirr(
		xirrFromDB,
		balance,
		todaysInvestmentBalances,
		new Date(positionsLastUpdatedAt),
		investmentTransactions
	);

	return json(
		{
			holdings,
			securities,
			todaysInvestmentBalances,
			xirr: newXirr
		},
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");
	const username = await getUserNameFromSession(request);

	switch (action) {
		case "search":
			// User searches for a ticker symbol from their holdings
			const searchTerm = formData.get("search") as string | null

			// If the user didn't provide a search term, the client expects an
			// empty object response
			if (searchTerm === null || searchTerm.length === 0) {
				return json({});
			}


			// Get the user's investment holdings
			const { securities, holdings } = await getInvestmentsAndAccountBalances(username);
			const aggregatedPositions = aggregateHoldings(holdings); // Dedupe holdings

			// Construct Ticker Symbol -> Security ID object/map
			const tickerSymbolToSecurityId = constructTickerSymbolToSecurityId(securities);

			// Find any ticker symbols that match search term, and retrieve
			// those tickers' security ids. This is needed because the holdings
			// response does *not* contain the ticker symbol - only the security
			// ID so we have to figure out what security IDs map to all the
			// matched ticker symbols
			const securityIdsToMatch = Object.keys(tickerSymbolToSecurityId) // Get all the ticker symbols that the user is holding
				.map(ticker => ticker.toUpperCase()) // Uppercase all of them
				.filter(ticker => ticker.includes(searchTerm.toUpperCase())) // Filter to only include ticker names that match the search term
				.map(ticker => tickerSymbolToSecurityId[ticker]); // Map over the matched tickers to return a list of their associated security IDs

			// Filter over all the user's holdings to only include those where
			// the security ID is included in the above list.
			const filteredHoldings = aggregatedPositions.filter(x => securityIdsToMatch.includes(x.security_id));

			return json({ filteredHoldings });

		case "saveNewXirrData":

			// This will help to calculate xirr from the time the user first signed up to the current day
			// User checks in that their account balances were last updated today.

			// @ts-ignore
			const positionsLastUpdatedAt = formData.get("positionsLastUpdatedAt").toString();
			// @ts-ignore
			const todaysInvestmentAccountBalances = parseFloat(formData.get("todaysInvestmentAccountBalances").toString());
			// @ts-ignore
			const xirrValue = parseFloat(formData.get("todaysXirr").toString());

			// updatePositionsLastUpdatedAt(
			//	username,
			//	positionsLastUpdatedAt,
			//	todaysInvestmentAccountBalances,
			//	xirrValue
			// );

			return null;
	}

};

const Holdings = () => {

	const {
		xirr,
		todaysInvestmentBalances,
		holdings,
		securities,
	} = useLoaderData<PositionsLoaderData>();

	const actionData = useActionData<{ filteredHoldings: Holding[] }>();
	const holdingsToDisplay = actionData?.filteredHoldings ?? holdings;

	// Checkpoint today as most recent time when the users'
	// xirr data was updated
	useCheckInForXIRR(todaysInvestmentBalances, xirr);

	return (
		<>
			<Outlet context={{ securities, holdings, holdingsToDisplay }} />

			<RateOfReturn xirr={xirr} />
			<Positions securities={securities} holdings={holdingsToDisplay} />
			<SectorWeight securities={securities} holdings={holdings} />
		</>
	);

};

export default Holdings;
