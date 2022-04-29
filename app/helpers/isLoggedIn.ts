import { isLoggedOut } from "./isLoggedOut"

export const isLoggedIn = async (request: Request) => {
	return !isLoggedOut(request);
}
