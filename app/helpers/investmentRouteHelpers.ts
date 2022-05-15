import { differenceInMonths, subDays } from "date-fns";
import { xirr as calculateXirr } from "@webcarrot/xirr";
import { InvestmentTransaction } from "plaid";
import { json } from "@remix-run/node";
import { getInvestmentsAndAccountBalances } from "~/routes/investments";
import { aggregateHoldings, constructTickerSymbolToSecurityId } from "~/components/Positions/Positions";

/**
 * Calculate the new XIRR value using the previous XIRR data set along with
 * current account balances and investment transactions since the last check in
 * date.
 *
 * Useful as this allows for storing intermediate XIRR values so the next XIRR
 * value can always be derived from the previous XIRR value with some additional
 * data.
 *
 * This way all no transactions ever need to be stored by the application, only
 * a diff of transactions is needed to calculate the new XIRR value each time.
 */
export const calculateNewXirr = (
	previousXirr: null | number,
	balanceAsOfCheckpointDate: number | undefined,
	currentBalance: number,
	checkpointDate: Date,
	transactionsSinceCheckpointDate: InvestmentTransaction[]
) => {

	try {

		const today = new Date();

		// Reformat the transactions to be ready to be consumed by the xirr
		// function.
		const cashflowsSinceCheckPointDate = transactionsSinceCheckpointDate.map(tx => {
			return {
				// Need to multiply by -1 since Plaid considers selling shares a
				// positive value (and buying shares a negative) whereas xirr
				// calculates these in the opposite way
				amount: (tx.amount - (tx.fees ?? 0)) * -1,
				date: new Date(tx.date)
			}
		});

		const previousXirrDataExists = previousXirr !== null && balanceAsOfCheckpointDate !== undefined;

		if (previousXirrDataExists) {

			// The user has a previous XIRR value and associated account balance
			//
			// We will use this previous XIRR value to calculate the new XIRR value.
			//
			// To do so, we need to discount the associated balance for the
			// previously calculated XIRR data to be equivalent as if that
			// discounted value was the lump sum initial investment on January 1st
			// at the start of the year.
			//
			// We do this by using the following equation solving for
			// discountPresentValuePercent:
			//
			// (discountPresentValuePercent + 1) ^ 12 = 1 + previousXirr
			//
			// Once we have the value for discountPresentValuePercent, we use this
			// to correctly discount the associated balance for the previously
			// stored XIRR data to its value at the start of the year on Janyary 1st
			// using the Net Present Value equation:
			//
			// 1 / [ (1 + discountPresentValuePercent)^monsthsSinceCheckPointDate ] * balanceAsOfCheckpointDate
			//
			// All the variables in the above are known:
			//
			// * discountPresentValuePercent was previously solved
			//
			// * monsthsSinceCheckPointDate is the difference in months between
			//   today and the checkpoint date when XIRR was last calculated
			//
			// * balanceAsOfCheckpointDate is stored from when XIRR was last
			//   calculated

			// Dates and date related helper values
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

			return {
				error: undefined,
				value: parseFloat(newXirr.toFixed(4))
			}


		} else {

			const cashflows = [
				{
					amount: (balanceAsOfCheckpointDate || currentBalance) * -1,
					date: !!balanceAsOfCheckpointDate ? checkpointDate : subDays(today, 1)
				},

				// On the off chance a user has placed transactions today and
				// they're being picked up by plaid.
				...cashflowsSinceCheckPointDate,

				{
					amount: currentBalance,
					date: today
				}
			];

			// The user *does not* have a previous XIRR value and associated
			// account balance
			//
			// If we have never calculated an XIRR value (as in this is the
			// user's first time hitting the positions page since making their
			// account) calculate it.

			const xirrValue = calculateXirr(cashflows);

			return {
				error: undefined,
				value: parseFloat(xirrValue.toFixed(4))
			}

		}
	} catch (err) {

		console.log(err);
		console.log("ERROR CAUGHT");

		return {
			error: "Could not calculate new XIRR value",
			value: undefined
		}
	}

};

/**
 * User searches for a ticker symbol from their holdings
 *
 * Used when client side JS is disabled and the user submits the search box
 */
export const searchActionHandler = async (username: string, searchTerm: string | null) => {

	// If the user didn't provide a search term, the client expects an
	// empty object response
	if (searchTerm === null || searchTerm.length === 0) {
		return json({});
	}


	// Get the user's investment holdings and dedupe them
	const { securities, holdings } = await getInvestmentsAndAccountBalances(username);
	const aggregatedPositions = aggregateHoldings(holdings);

	// Construct Ticker Symbol -> Security ID object/map
	const tickerSymbolToSecurityId = constructTickerSymbolToSecurityId(securities);

	// Find any ticker symbols that match search term, and retrieve
	// those tickers' security ids. This is needed because the holdings
	// response does *not* contain the ticker symbol - only the security
	// ID so we have to figure out what security IDs map to all the
	// matched ticker symbols
	const securityIdsToMatch = Object.keys(tickerSymbolToSecurityId) // Get all the ticker symbols that the user is holding
		.map(ticker => ticker.toUpperCase()) // Uppercase to normalize
		.filter(ticker => ticker.includes(searchTerm.toUpperCase())) // Filter to only include ticker names that match the search term
		.map(ticker => tickerSymbolToSecurityId[ticker]); // Map over the matched tickers to return a list of their associated security IDs

	// Filter over all the user's holdings to only include those where
	// the security ID is included in the above list.
	const filteredHoldings = aggregatedPositions.filter(x => securityIdsToMatch.includes(x.security_id));

	return json({
		filteredHoldings
	});

};
