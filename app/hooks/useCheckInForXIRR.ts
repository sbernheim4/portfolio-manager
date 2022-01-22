import { isToday } from "date-fns";
import { useEffect } from "react";
import { useSubmit } from "remix";
import { Option } from "excoptional";
import { NewXirrCalculation } from "~/types/positions.types";

export const useCheckInForXIRR = (
	xirrDataLastUpdatedOn: Option<string>,
	todaysInvestmentAccountBalances: number,
	xirr: NewXirrCalculation
) => {

	const submit = useSubmit();


	useEffect(() => {

		// Don't update if we've already updated today or if there was an error
		// calculating the new xirr value
		xirrDataLastUpdatedOn.map(dateString => {

			if (isToday(new Date(dateString)) || xirr.error === undefined) {
				return
			}

			const today = new Date();
			const data = new FormData();

			data.set("xirrDataLastUpdatedOn", today.toString());
			data.set("todaysInvestmentAccountBalances", todaysInvestmentAccountBalances.toString());
			data.set("todaysXirr", xirr.toString());

			data.set("_action", "saveNewXirrData");

			submit(data, { method: "post", action: "/positions" });
		})

	}, []);

};
