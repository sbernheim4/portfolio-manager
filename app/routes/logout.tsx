import { ActionFunction, LinksFunction, LoaderFunction, redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { getSession, destroySession } from "~/helpers/session";
import { validateIsLoggedIn } from "~/remix-helpers";
import logoutStyles from './../styles/logout.css';

export const links: LinksFunction = () => {

	return [
		{ rel: 'stylesheet', href: logoutStyles }
	];

};

export const loader: LoaderFunction = async ({ request }) => {
	await validateIsLoggedIn(request);
	return null;
};

export const action: ActionFunction = async ({ request }) => {

	const session = await getSession(
		request.headers.get("Cookie")
	);

	const cookie = await destroySession(session)

	return redirect("/sign-in", {
		headers: { "Set-Cookie": cookie }
	});
};

const Logout = () => {
	return (
		<div className="logout">
			<p>Are you sure you want to log out?</p>
			<Form method="post">
				<button>Log Out</button>
			</Form>

			<Link to="/">Never mind</Link>
		</div>
	);
};

export default Logout;
