import { ActionFunction, Form, Link, redirect } from "remix";
import { getSession, destroySession } from "~/helpers/session";

export const action: ActionFunction = async ({ request }) => {

	const session = await getSession(
		request.headers.get("Cookie")
	);

	return redirect("/login", {
		headers: { "Set-Cookie": await destroySession(session) }
	});
};

const LogoutRoute = () => {
	return (
		<>
			<p>Are you sure you want to log out?</p>
			<Form method="post">
				<button>Logout</button>
			</Form>

			<Link to="/">Never mind</Link>
		</>
	);
}

export default LogoutRoute;
