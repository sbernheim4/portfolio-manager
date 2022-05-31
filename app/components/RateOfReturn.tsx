import { Option } from "excoptional";

export const RateOfReturn = (props: {
	xirr: Option<number>
}) => {

	const text = props.xirr
		.map(val => "Your IRR is " + val).
		getOrElse("Could not calculate XIRR");

	return (
		<>
			<h2 className="investments__irr">{text}</h2>
		</>
	);

};

