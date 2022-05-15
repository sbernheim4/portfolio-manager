import { decimalFormatter } from "./formatters";

export const collapseDollarAmountText = (dollarAmount: number) => {
	if (dollarAmount >= 100000) {
		return '$' + decimalFormatter.format(dollarAmount / 10000) + 'K'
	} else if (dollarAmount >= 10000) {
		return '$' + decimalFormatter.format(dollarAmount / 1000) + 'K'
	} else if (dollarAmount >= 1000) {
		return '$' + decimalFormatter.format(dollarAmount / 1000) + 'K'
	} else {
		return '$' + decimalFormatter.format(dollarAmount);
	};
};
