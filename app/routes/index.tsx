import { Link, LoaderFunction } from "remix";
import { validateUserIsLoggedIn } from "~/helpers/validateUserIsLoggedIn";



export const loader: LoaderFunction = async ({ request }) => {
    // return await validateUserIsLoggedIn(request);
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
