import { isToday } from "date-fns";
import { useEffect } from "react";
import { useSubmit } from "remix";
import { getXirrData } from "~/helpers/db";

export const useCheckInForXIRR = async (
	username: string,
	todaysInvestmentAccountBalances: number,
	xirr: number
) => {

	const submit = useSubmit();

	const { xirrDataLastUpdatedOn } = await getXirrData(username);


	useEffect(() => {

		// Don't update if we've already updated today
		if (xirrDataLastUpdatedOn && isToday(new Date(xirrDataLastUpdatedOn))) {
			return;
		}

		const today = new Date();
		const data = new FormData();

		data.set("xirrDataLastUpdatedOn", today.toString());
		data.set("todaysInvestmentAccountBalances", todaysInvestmentAccountBalances.toString());
		data.set("todaysXirr", xirr.toString());

		data.set("_action", "saveNewXirrData");

		submit(data, { method: "post", action: "/positions" });

	}, []);

};
