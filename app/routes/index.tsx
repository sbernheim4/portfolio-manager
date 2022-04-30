import { LoaderFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { validateIsLoggedIn } from "~/remix-helpers";

export const loader: LoaderFunction = async ({ request }) => {
	await validateIsLoggedIn(request);

    return null;
};

export default () => {

    return (
        <div>
            <h1>Welcome to the homepage</h1>
            <Link to={'/manage-accounts'}>Link an account</Link>
            <br />
            <Link to={'/dashboard'}>Go to the dashboard</Link>
        </div>
    );

};
