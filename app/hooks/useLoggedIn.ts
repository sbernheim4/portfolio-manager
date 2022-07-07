import { useSubmit } from "@remix-run/react";
import { useEffect } from "react";

/**
 * Custom Hook to validate on the client if a user is logged in.
 *
 * Necessary since sometimes the session doesn't get correctly destroyed and
 * personal data is cached in the browser which shouldn't be visible if the user
 * is logged out.
 *
 * Should be **the first hook called** by route components that display personal
 * data where the data is also cached.
 *
 * Ensure routes have an action function to handle the action type 'isLoggedIn'
 * which simply run `await validateIsLoggedIn(request);`
 *
 * @example
 * export const action: ActionFunction = async ({ request }) => {
 *
 *   const formData = await request.formData();
 *   const action = formData.get("_action");
 *
 *   switch (action) {
 *     case 'isLoggedIn':
 *       await validateIsLoggedIn(request);
 *   }
 * }
 */
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
