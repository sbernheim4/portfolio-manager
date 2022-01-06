import { ActionFunction, Form, json, LoaderFunction, redirect, useLoaderData } from "remix";
import { userId } from "~/helpers/db";
import { getSession, commitSession } from "~/helpers/session";

const validateCredentials = async (username: FormDataEntryValue | null, password: FormDataEntryValue | null) => {
	// throw new Error("Function not implemented.");
	// TODO:
	// 1. find a user with username
	// 2. hash the password
	// 3. validate the hashed password matches the found user's hashed password
	// 4. if true return the user ids
	// 5. if false return null
	return userId;
}

export const loader: LoaderFunction = async ({ request }) => {
	const session = await getSession(request.headers.get("Cookie"));

	// Logged in user can proceed to the hompage
	if (session.has("userId")) {
		return redirect("/");
	}

	// User is logged out
	const data = {
		error: session.get("error")
	};

	return json(data, {
		headers: {
			"Set-Cookie": await commitSession(session)
		}
	})

};

export const action: ActionFunction = async ({ request }) => {
	const session = await getSession(request.headers.get("userId"));

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

	return redirect("/", {
		headers: {
			"Set-Cookie": await commitSession(session)
		}
	});

};

const Login = () => {

	const { currentUser, error } = useLoaderData();
	console.log({ currentUser });

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

