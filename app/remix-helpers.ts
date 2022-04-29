import { redirect } from "@remix-run/node";
import { isLoggedOut } from "./helpers/isLoggedOut";

export const validateIsLoggedIn = async (request: Request) => {
	if (await isLoggedOut(request)) {
		throw redirect("/login");
	}
};
