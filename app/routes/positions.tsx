import { AccountBase, Holding } from "plaid";
import { useEffect } from "react";
import { ActionFunction, json, LinksFunction, LoaderFunction, MetaFunction, Outlet, useActionData, useLoaderData, useSubmit } from "remix";
import { Positions, links as positionStyles, aggregateHoldings, constructTickerSymbolToSecurityId } from "~/components/Positions/Positions";
// import { RateOfReturn } from "~/components/RateOfReturn";
import { SectorWeight } from "~/components/SectorWeight";
import { updateLastAccessed } from "~/helpers/db";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getInvestmentTransactions, getPlaidAccountBalances } from "~/helpers/plaidUtils";
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
	console.log({ action });

	switch (action) {
		case "search":

			const queryParams = await request.text();
			const searchTerm = queryParams.slice(queryParams.indexOf("=") + 1).toUpperCase();

			// Return nothing if the search term is an empty string;
			if (searchTerm.length === 0) {
				return json({});
			}

			// Retrieve data
			const { securities, holdings } = await getInvestmentsAndAccountBalances();
			const aggregatedPositions = aggregateHoldings(holdings); // Dedupe holdings

			// Construct Ticker Symbol -> Security ID object
			const tickerSymbolToSecurityId = constructTickerSymbolToSecurityId(securities);

			// Find any ticker symbols that match search term, and retrieve those tickers' security ids
			const securityIdsToMatch = Object.keys(tickerSymbolToSecurityId)
				.map(ticker => ticker.toUpperCase()) // Normalize
				.filter(ticker => ticker.includes(searchTerm)) // Filter
				.map(ticker => tickerSymbolToSecurityId[ticker]); // Ticker -> Security ID

			const filteredHoldings = aggregatedPositions.filter(x => securityIdsToMatch.includes(x.security_id));

			return json({ filteredHoldings });

		case "updateLastAccessed":
			console.log("IN THE RIGHT ACTION HANDLER");
			const lastAccessed = formData.get("lastAccessed");
			await updateLastAccessed(lastAccessed);
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

	const submit = useSubmit();
	const actionData = useActionData<{ filteredHoldings: Holding[] }>();
	const holdingsToDisplay = actionData?.filteredHoldings ?? holdings;

	useEffect(() => {
		const today = new Date().toISOString();
		const data = new FormData();
		data.set("lastAccessed", today);
		data.set("_action", "updateLastAccessed");
		submit(data, { method: "post", action: "/positions" });
	}, []);

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
