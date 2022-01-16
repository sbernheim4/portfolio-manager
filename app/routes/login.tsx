import { ActionFunction, Form, json, LoaderFunction, redirect, useLoaderData } from "remix";
import { getUserInfoCollection } from "~/helpers/db";
import { getSession, commitSession } from "~/helpers/session";
import bcrypt from 'bcryptjs';
import { UserInfo } from "~/types/UserInfo.types";

const validateCredentials = async (
	username: FormDataEntryValue | null,
	password: FormDataEntryValue | null
) => {

	try {

		const userInfoCollection = await getUserInfoCollection();
		const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;
		const { salt } = userInfo;
		const hashedPassword = bcrypt.hashSync(password as string, salt)

		if (userInfo === null) {
			// No user with that ID found
			return null
		} else if (userInfo.password !== hashedPassword) {
			// Incorrect Password
			return null;
		} else {
			return userInfo.user;
		}

	} catch (err) {

		console.log("error:", err)

	}

}

export const isLoggedIn = async (request: Request) => {
	return !isLoggedOut(request);
};

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

export const loader: LoaderFunction = async ({ request }) => {
	const session = await getSession(request.headers.get("Cookie"));

	// Logged in user can proceed to the hompage
	if (session.has("userId")) {
		return redirect("/");
	}

	// User is logged out
	const error = session.get("error");

	const data = {
		error
	};

	const committedSession = await commitSession(session);

	return json(
		data,
		{
			headers: {
				"Set-Cookie": committedSession
			}
		}
	)

};

export const action: ActionFunction = async ({ request }) => {
	const session = await getSession(request.headers.get("Cookie"));

	const form = await request.formData();

	const username = form.get("username");
	const password = form.get("password");

	const userId = await validateCredentials(
		username,
		password
	);

	if (userId === null) {
		session.flash("error", "Invalid username/password");

		// Redirect back to the login page with errors.
		return redirect("/login", {
			headers: {
				"Set-Cookie": await commitSession(session)
			}
		});
	}

	session.set("userId", userId);
	const cookie = await commitSession(session);

	return redirect(
		"/",
		{ headers: { "Set-Cookie": cookie } }
	);

};

const Login = () => {

	const { currentUser, error } = useLoaderData();

	return (
		<>
			<p>Login below</p>

			{
				error ?
					<div className="error">{error}</div> :
					null
			}

			<Form method="post">
				<div>
					<p>Please sign in</p>
				</div>

				<label>
					Username: <input type="text" name="username" />
				</label>

				<label>
					Password:{" "}
					<input type="password" name="password" />
				</label>

				<input type="submit" name="Submit" />
			</Form>

		</>
	);

};

export default Login;

