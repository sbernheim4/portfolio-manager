import { AccountBase, Holding } from "plaid";
import {
    ActionFunction,
    json,
    LinksFunction,
    LoaderFunction,
    MetaFunction,
    redirect,
} from "@remix-run/node";
import { Outlet, useActionData, useLoaderData } from "@remix-run/react";
import { HoldingsSecurities } from '~/types/index';
import { Positions, links as positionStyles } from "~/components/Positions/Positions";
import { PositionsLoaderData } from "~/types/positions.types";
import { RateOfReturn } from "~/components/RateOfReturn";
import { SectorWeight } from "~/components/SectorWeight";
import { getInvestmentHoldings, getInvestmentTransactions, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { getXirrData, updatePositionsLastUpdatedAt } from "~/helpers/db";
import { getUserNameFromSession } from "~/helpers/session";
import { isFilled } from "~/helpers/isFilled";
import { useCheckInForXIRR } from "~/hooks/useCheckInForXIRR";
import { calculateNewXirr, searchActionHandler } from "~/helpers/positionRouteHelpers";
import { Option } from "excoptional";
import { isLoggedOut } from "~/helpers/isLoggedOut";

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

/**
 * Helper function to retrieve the users investment holdings and account
 * balances.
 *
 * Parallelizes both API requests to improve speed
 *
 * Often both calls are needed in components hence the effort to combine the two
 * API calls and the work to parallelize them.
 */
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
		return redirect("/sign-in");
	}

	const username = await getUserNameFromSession(request);

	const { balances, holdings, securities } = await getInvestmentsAndAccountBalances(username);
	const { xirr: xirrFromDB, balance, xirrDataLastUpdatedOn } = await getXirrData(username)

	const today = new Date();
	const fetchTransactionsFrom = new Date(xirrDataLastUpdatedOn || today);

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
		xirrDataLastUpdatedOn === undefined ? today : new Date(xirrDataLastUpdatedOn),
		investmentTransactions
	);

	return json(
		{
			holdings,
			securities,
			xirrDataLastUpdatedOn,
			todaysInvestmentBalances,
			xirr: newXirr
		},
		{ headers: { "Cache-Control": "private, max-age=14400, stale-while-revalidate=28800" } }
	);

};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");

	const username = await getUserNameFromSession(request);

	switch (action) {
		case "search":

			const searchTerm = formData.get("search") as string | null

			return searchActionHandler(username, searchTerm);

		case "saveNewXirrData":

			// User has a new set of XIRR data that should be saved to make
			// calculating future XIRR values easier.

			// @ts-ignore
			const xirrDataLastUpdatedOn = formData.get("xirrDataLastUpdatedOn").toString();
			// @ts-ignore
			const todaysInvestmentAccountBalances = parseFloat(formData.get("todaysInvestmentAccountBalances").toString());
			// @ts-ignore
			const xirrValue = parseFloat(formData.get("todaysXirr").toString());

			updatePositionsLastUpdatedAt(
				username,
				xirrDataLastUpdatedOn,
				todaysInvestmentAccountBalances,
				xirrValue
			);

			return null;
	}

};

const Holdings = () => {

	const {
		xirr,
		todaysInvestmentBalances,
		holdings,
		securities,
		xirrDataLastUpdatedOn
	} = useLoaderData<PositionsLoaderData>();

	const actionData = useActionData<{ filteredHoldings: Holding[] }>();
	const holdingsToDisplay = actionData?.filteredHoldings ?? holdings;

	// Checkpoint today as most recent time when the users'
	// xirr data was updated
	useCheckInForXIRR(xirrDataLastUpdatedOn, todaysInvestmentBalances, xirr);

	return (
		<>
			<Outlet context={{ securities, holdings, holdingsToDisplay }} />

			<RateOfReturn xirr={Option.of(xirr.value)} />
			<Positions securities={securities} holdings={holdingsToDisplay} />
			<SectorWeight securities={securities} holdings={holdings} />
		</>
	);

};

export default Holdings;
