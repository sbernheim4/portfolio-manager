import { isToday } from "date-fns";
import { useEffect } from "react";
import { useSubmit } from "@remix-run/react";
import { NewXirrCalculation } from "~/types/investments.types";

export const useCheckInForXIRR = (
	xirrDataLastUpdatedOn: string | undefined,
	todaysInvestmentAccountBalances: number,
	xirr: NewXirrCalculation
) => {
	const submit = useSubmit();

	useEffect(() => {

		// Don't update if we've already updated today or if there was an error
		// calculating the new xirr value
		if (xirrDataLastUpdatedOn !== undefined && isToday(new Date(xirrDataLastUpdatedOn)) || xirr.error !== undefined) {
			return;
		}

		const today = new Date();
		const data = new FormData();

		data.set("xirrDataLastUpdatedOn", today.toString());
		data.set("todaysInvestmentAccountBalances", todaysInvestmentAccountBalances.toString());
		data.set("todaysXirr", xirr.value.toString());

		data.set("_action", "saveNewXirrData");

		submit(data, { method: "post", action: "/positions" });

	}, []);

};
