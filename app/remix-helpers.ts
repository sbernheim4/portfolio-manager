import { redirect } from "@remix-run/node";
import { isLoggedOut } from "./helpers/isLoggedOut";
import { destroySession, getSession } from "./helpers/session";

export const validateIsLoggedIn = async (request: Request) => {

	if (await isLoggedOut(request)) {

		const session = await getSession(request.headers.get("Cookie"));

		const cookie = await destroySession(session);

		throw redirect(
			"/sign-in",
			{ headers: { "Set-Cookie": cookie }}
		);
	}

};
