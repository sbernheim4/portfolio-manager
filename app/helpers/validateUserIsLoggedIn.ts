import { redirect } from "remix";
import { getSession } from "./session";

export const validateUserIsLoggedIn = async (request: Request) => {

	const session = await getSession(request.headers.get("Cookie"));

	if (session.has("userId")) {
		return true;
	}

	return redirect("/login")

};

