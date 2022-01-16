import { useEffect } from "react";
import { useSubmit } from "remix";

export const useCheckInForXIRR = () => {

	const submit = useSubmit();

	useEffect(() => {

		const today = new Date().toISOString();

		const data = new FormData();
		data.set("positionsLastUpdatedAt", today);
		data.set("_action", "positionsLastUpdatedAt");

		submit(data, { method: "post", action: "/positions" });

	}, []);

};
