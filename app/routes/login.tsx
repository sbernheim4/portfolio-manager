import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getUserInfoCollection } from "~/helpers/db";
import { getSession, commitSession } from "~/helpers/session";
import bcrypt from 'bcryptjs';
import { UserInfo } from "~/types/UserInfo.types";

/**
 * Callers of this function expect to receive null if there is an issue
 * validating the credentials. Otherwise the user's id should be returned
 */
const validateCredentials = async (
	username: FormDataEntryValue | null,
	passwordFromForm: FormDataEntryValue | null
) => {

	try {

		const userInfoCollection = await getUserInfoCollection();
		const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;

		const noUserFound = userInfo === null;

		if (noUserFound) {
			return null
		}

		const { salt, password } = userInfo;
		const hashedPassword = bcrypt.hashSync(passwordFromForm as string, salt)
		const incorrectPassword = password !== hashedPassword

		if (incorrectPassword) {
			return null;
		} else {
			return userInfo.user;
		}

	} catch (err) {

		console.log("error:", err)

		return null;

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
	const session = await getSession(
		request.headers.get("Cookie")
	);

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

