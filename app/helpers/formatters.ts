export const dollarFormatter = Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

export const decimalFormatter = Intl.NumberFormat('en-US', {
	style: "decimal"
});

export const percentageFormatter = Intl.NumberFormat('en-US', {
	style: "percent"
});

export const replaceSpacesWithDashes = (str: string) => {
	return str.replace(/\s/g, '-');
};

export const lowerCase = (str: string) => {
	return str.toLowerCase();
};
