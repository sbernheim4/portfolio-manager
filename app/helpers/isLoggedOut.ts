import { getUserNameFromSession } from "./session";

export const isLoggedOut = async (request: Request) => {

	const userId = await getUserNameFromSession(request);

	if (userId === null || userId === undefined) {
		return true;
	} else {
		return false;
	}

};

