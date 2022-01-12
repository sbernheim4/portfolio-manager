import { ActionFunction, Form, json, LoaderFunction, redirect, useLoaderData } from "remix";
import { userId } from "~/helpers/db";
import { getSession, commitSession } from "~/helpers/session";

const validateCredentials = async (
	username: FormDataEntryValue | null,
	password: FormDataEntryValue | null
) => {

	// throw new Error("Function not implemented.");
	// TODO:
	// 1. find a user with username
	// 2. hash the password
	// 3. validate the hashed password matches the found user's hashed password
	// 4. if true return the user's id
	// 5. if false return null -- Or send to account creation page with data
	// filled out?
	return userId;
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

	// for (const keyname of request.headers.keys()) {
	// 	console.log(keyname)
	// }

	// Logged in user can proceed to the hompage
	if (session.has("userId")) {
		return redirect("/");
	}

	const error = session.get("error");

	// User is logged out
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
		{
			headers: {
				"Set-Cookie": cookie
			}
		}
	);

};

const Login = () => {

	const { currentUser, error } = useLoaderData();

	console.log({
		currentUser,
		error
	});

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

