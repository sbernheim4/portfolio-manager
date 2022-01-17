import { useEffect } from "react";
import { useSubmit } from "remix";

export const useCheckInForXIRR = (
	todaysInvestmentAccountBalances: number,
	xirr: number
) => {

	const submit = useSubmit();

	useEffect(() => {

		const today = new Date();
		const data = new FormData();

		data.set("positionsLastUpdatedAt", today.toString());
		data.set("todaysInvestmentAccountBalances", todaysInvestmentAccountBalances.toString());
		data.set("todaysXirr", xirr.toString());

		data.set("_action", "saveNewXirrData");

		submit(data, { method: "post", action: "/positions" });

	}, []);

};
