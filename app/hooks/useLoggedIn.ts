import { useSubmit } from "@remix-run/react";
import { useEffect } from "react";

export const useLoggedIn = () => {

	const submit = useSubmit();

	const data = new FormData();
	data.set('_action', 'isLoggedIn');

	useEffect(() => {

		submit(data, {
			method: 'post'
		});

	}, []);
};
