export const RateOfReturn = (props: {
	xirr: number
}) => {

	return (
		<>
			<h2>Your total portfolio Internal Rate of Return is: {props.xirr}</h2>
		</>
	);

};

