import { format } from "date-fns";
import { AccountBase } from "plaid";
import { positiveAccountTypes } from "~/components/NetworthComponent";
import { getAccountBalancesFromDB } from "~/helpers/db";
import { AccountBalanceChartData } from "~/routes/portfolio-balance";

export const calculateTodaysTotalBalance = (accounts: AccountBase[]) => {
	return accounts
		.reduce((acc, curr) => {
			const isPositive = positiveAccountTypes.includes(curr.type);
			return isPositive ?
				acc + (curr.balances.current ?? 0) :
				acc - (curr.balances.current ?? 0)
		}, 0);
};

export const getPerAccountBalancesForToday = (accounts: AccountBase[]) => {

	const accountIdsToName = accounts
		.filter(x => !!x.balances.current || !!x.balances.available)
		.map(acc => {
			return {
				accountId: acc.account_id,
				name: acc.name
			};
		});

	const todaysPerAccountBalances = accounts.reduce((acc, curr) => {
		return !!curr.balances.current || !!curr.balances.available ?
			{
				...acc,
				[curr.account_id]: (curr.balances.current ?? curr.balances.available) as number,
			} :
			acc;
	}, {} as Record<string, number>);

	return [
		accountIdsToName,
		todaysPerAccountBalances
	] as [
			Array<{ accountId: string; name: string; }>,
			Record<string, number>
		];

};

export const getHistoricalPerAccountBalances = async (username: string) => {

	const historicalAccountBalances = await getAccountBalancesFromDB(username);

	const formattedHistoricalAccountBalances = historicalAccountBalances.map(dataPoint => {
		return {
			...dataPoint,
			date: format(new Date(dataPoint.date), "MM/dd/yyyy"),
		};
	});

	return formattedHistoricalAccountBalances as AccountBalanceChartData;
};

