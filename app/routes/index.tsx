import { LoaderFunction, redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { isLoggedOut } from "~/helpers/isLoggedOut";

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
            <Link to={'/manage-accounts'}>Link an account</Link>
            <br />
            <Link to={'/dashboard'}>Go to the dashboard</Link>
        </div>
    );

};
