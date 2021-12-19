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
