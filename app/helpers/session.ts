import { createCookieSessionStorage } from "remix";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
        name: "__session",

        // all of these are optional
        expires: new Date(Date.now() + 60),
        httpOnly: true,
        maxAge: 60,
        path: "/",
        sameSite: "lax",
        secrets: ["s3cret1"],
        secure: true
    }
});

export { getSession, commitSession, destroySession };

export const getUserNameFromSession = async (request: Request) => {
    const session = await getSession(request.headers.get("Cookie"));

    const username = session.get("userId");

    return username;

};
