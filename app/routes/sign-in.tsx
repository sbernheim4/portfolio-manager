import { ActionFunction, json, LinksFunction, LoaderFunction, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getUserInfoCollection } from "~/helpers/db.server";
import { getSession, commitSession } from "~/helpers/session";
import bcrypt from 'bcryptjs';
import { UserInfo } from "~/types/UserInfo.types";
import signInStyles from './../styles/signIn.css';

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
			console.log('No user found');
			return null
		}

		const { salt, password } = userInfo;
		const hashedPassword = bcrypt.hashSync(passwordFromForm as string, salt)
		const isIncorrectPassword = password !== hashedPassword

		if (isIncorrectPassword) {
			console.log('Incorrect password');
			return null;
		} else {
			console.log('logged in successfully');
			return userInfo.user;
		}

	} catch (err) {

		console.log("error:", err)

		return null;

	}

};

export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: signInStyles }
	];
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
		return redirect("sign-in", {
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

const SignIn = () => {

	const { error } = useLoaderData();

	return (
		<div className="login">

			<div className="login--header">
				<h2 className="login--header--text">Sign In</h2>
				<p className="login--header--error">{error}</p>
			</div>

			<Form method="post">

				<label>
					Username:
					<input className="login--username" placeholder="johnsmith" type="text" name="username" />
				</label>

				<label>
					Password:
					<br />
					<input className="login--password" type="password" name="password" />
				</label>

				<br />
				<input className="login--submit" value="Sign In" type="submit" name="Submit" />
			</Form>

			<Link to="/sign-up"><p>Create your account</p></Link>

		</div >
	);

};

export default SignIn;

