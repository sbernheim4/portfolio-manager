import { AccountBase, Holding } from "plaid";
import { Option } from 'excoptional';
import { useEffect } from "react";
import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction, Outlet, useActionData, useLoaderData, useSubmit } from "remix";
import { Positions, links as positionStyles, aggregateHoldings, constructTickerSymbolToSecurityId } from "~/components/Positions/Positions";
// import { RateOfReturn } from "~/components/RateOfReturn";
import { SectorWeight } from "~/components/SectorWeight";
import { updateLastAccessed } from "~/helpers/db";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getInvestmentTransactions, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { validateUserIsLoggedIn } from "~/helpers/validateUserIsLoggedIn";
import { HoldingsSecurities } from '~/types/index';
import { PositionsLoaderData } from "~/types/positions.types";

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

export const getInvestmentsAndAccountBalances = async () => {
	const promises: [
		Promise<HoldingsSecurities>,
		Promise<Array<AccountBase>>
	] = [
			getInvestmentHoldings(),
			getPlaidAccountBalances()
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

export const loader: LoaderFunction = async () => {

	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances();
	const investmentTransactions = await getInvestmentTransactions();
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
			const { securities, holdings } = await getInvestmentsAndAccountBalances();
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

		case "updateLastAccessed":
			// User checks in that their account balances were last updated
			// today.
			const lastAccessed = Option.of(formData.get("updateLastAccessed")?.toString());
			await updateLastAccessed(lastAccessed);
			return null;
	}

};

export const useCheckIn = () => {

	const submit = useSubmit();

	useEffect(() => {

		const today = new Date().toISOString();

		const data = new FormData();
		data.set("updateLastAccessed", today);
		data.set("_action", "updateLastAccessed");

		submit(data, { method: "post", action: "/positions" });

	}, []);

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
	// positions balance was updated
	useCheckIn();

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
