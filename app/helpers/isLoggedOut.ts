import { getSession } from "./session";

export const isLoggedOut = async (request: Request) => {

	const sessionCookie = request.headers.get("Cookie");
	const session = await getSession(sessionCookie);
	const userId = session.get("userId");

	if (userId === null || userId === undefined) {
		return true;
	} else {
		return false;
	}

};

