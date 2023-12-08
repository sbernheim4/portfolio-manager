import { createCookieSessionStorage } from "@remix-run/node";

// 1 year
// 365 days/year * 24 hours/day * 60 min/hour * 60 sec/min
const maxAge = 365 * 24 * 60 * 60;

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
	// a Cookie from `createCookie` or the CookieOptions to create one
	cookie: {
		name: "__session",
		httpOnly: true,
		maxAge,
		path: "/",
		sameSite: "lax",
		secrets: ["s3cret1"],
		// *Note* be careful when setting this to `true`, as compliant clients will
		// not send the cookie back to the server in the future if the browser does
		// not have an HTTPS connection.
		// secure: true
	}
});

export { getSession, commitSession, destroySession };

export const getUserNameFromSession = async (request: Request) => {

	const session = await getSession(request.headers.get("Cookie"));

	const username = session.get("userId") as string;

	return username;

};
