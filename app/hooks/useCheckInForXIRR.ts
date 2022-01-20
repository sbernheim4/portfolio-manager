import { isToday } from "date-fns";
import { useEffect } from "react";
import { useSubmit } from "remix";
import { Option } from "excoptional";

export const useCheckInForXIRR = (
	xirrDataLastUpdatedOn: Option<string>,
	todaysInvestmentAccountBalances: number,
	xirr: number
) => {

	const submit = useSubmit();


	useEffect(() => {

		// Don't update if we've already updated today
		xirrDataLastUpdatedOn.map(dateString => {

			if (isToday(new Date(dateString))) {
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
