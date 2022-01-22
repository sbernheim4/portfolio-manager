import { Option } from "excoptional";

export const RateOfReturn = (props: {
	xirr: Option<number>
}) => {

	const text = props.xirr.getOrElse("Could not calculate XIRR")

	return (
		<>
			<h2>{text}</h2>
		</>
	);

};

