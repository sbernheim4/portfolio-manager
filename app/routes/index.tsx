import { Link, LoaderFunction, redirect } from "remix";
import { isLoggedOut } from "./login";



export const loader: LoaderFunction = async ({ request }) => {

	if (await isLoggedOut(request)) {
		return redirect("/login");
	}

	return null;
};

export default () => {

	return (
		<div>
			<h1>Welcome to the homepage</h1>
			<Link to={'/link-account'}>Link an account</Link>
			<br />
			<Link to={'/dashboard'}>Go to the dashboard</Link>
		</div>
	);

};
