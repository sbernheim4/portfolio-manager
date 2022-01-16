// import { RateOfReturn } from "~/components/RateOfReturn";
// import { useCheckInForXIRR } from "~/hooks/useCheckInForXIRR";
import { AccountBase, Holding } from "plaid";
import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction, Outlet, redirect, useActionData, useLoaderData } from "remix";
import { Option } from 'excoptional';
import { HoldingsSecurities } from '~/types/index';
import { Positions, links as positionStyles, aggregateHoldings, constructTickerSymbolToSecurityId } from "~/components/Positions/Positions";
import { PositionsLoaderData } from "~/types/positions.types";
import { SectorWeight } from "~/components/SectorWeight";
import { getInvestmentHoldings, getInvestmentTransactions, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getPositionsLastUpdatedAt, updatePositionsLastUpdatedAt } from "~/helpers/db";
import { getUserNameFromSession } from "~/helpers/session";
import { isFilled } from "~/helpers/isFilled";
import { isLoggedOut } from "./login";

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

};

export const loader: LoaderFunction = async ({ request }) => {

	if (await isLoggedOut(request)) {
		return redirect("/login");
	}

	const username = await getUserNameFromSession(request);
	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances(username);

	const fetchTransactionsFrom = new Date(await getPositionsLastUpdatedAt(username));

	// Used for calculating XIRR
	const investmentTransactions = await getInvestmentTransactions(username, fetchTransactionsFrom);
	const dates = investmentTransactions.map(tx => tx.date);
	const cashflows = investmentTransactions.map(tx => tx.amount - (tx.fees ?? 0));

	return json(
		{
			cashflowData: [cashflows, dates],
			balances,
			holdings,
			securities,
			investmentTransactions
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

		case "positionsLastUpdatedAt":
			// This will help to calculate xirr from the time the user first signed up to the current day
			// User checks in that their account balances were last updated
			// today.
			const lastAccessed = Option.of(formData.get("positionsLastUpdatedAt")?.toString());
			await updatePositionsLastUpdatedAt(username, lastAccessed);
			return null;
	}

};

const Holdings = () => {

	const {
		// cashflowData,
		// investmentTransactions,
		holdings,
		securities,
	} = useLoaderData<PositionsLoaderData>();

	const actionData = useActionData<{ filteredHoldings: Holding[] }>();
	const holdingsToDisplay = actionData?.filteredHoldings ?? holdings;

	// Checkpoint today as most recent time when the users'
	// positions balance was updated - will be used when
	// calculating xirr
	// useCheckInForXIRR();

	return (
		<>
			<Outlet context={{ securities, holdings, holdingsToDisplay }} />

			{ /* <RateOfReturn investmentTransactions={investmentTransactions} cashflowData={cashflowData} /> */}
			<Positions securities={securities} holdings={holdingsToDisplay} />
			<SectorWeight securities={securities} holdings={holdings} />
		</>
	);

};

export default Holdings;
