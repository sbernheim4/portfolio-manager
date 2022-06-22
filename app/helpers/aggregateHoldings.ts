import { Holding } from 'plaid';

export const aggregateHoldings = (holdings: Holding[]) => {


	const consolidateHolding = (
		holdingList: Holding[],
		holding: Holding,
		entryIndex: number
	) => {

		const existingHoldingEntry = holdingList[entryIndex];

		const updatedHoldingEntry: Holding = {
			...holding,
			quantity: existingHoldingEntry.quantity + holding.quantity,
			institution_value: existingHoldingEntry.institution_value + holding.institution_value,

			// TODO: Need to figure out how to calculate the cost basis across all accounts that
			// hold this security
			//
			// cost_basis:
			//
		};

		// Remove the existing holding entry from the list - it will be replaced
		// by `updatedHoldingEntry`
		const cleanedHoldingArray = [
			...holdingList.slice(0, entryIndex),
			...holdingList.slice(entryIndex + 1)
		];

		return [
			updatedHoldingEntry,
			...cleanedHoldingArray
		];

	};

	const mergedHoldings = holdings.reduce((acc, curr) => {

		const currentSecurityId = curr.security_id;
		const entryIndex = acc.findIndex(val => val.security_id === currentSecurityId);
		const securityAlreadyExists = entryIndex !== -1;

		if (!securityAlreadyExists) {
			return [...acc, curr];
		} else {
			return consolidateHolding(acc, curr, entryIndex);
		}

	}, [] as Holding[]);

	return mergedHoldings;

};

