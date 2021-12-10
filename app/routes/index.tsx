import { Link } from "remix";

export default () => {

    return (
		<div>
			<h1>Welcome to the homepage</h1>
			<Link to={'/link-account'}>Link an account</Link>
		</div>
	);

};
