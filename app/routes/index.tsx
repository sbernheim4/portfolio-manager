import { Link } from "@remix-run/react";
import { LinksFunction } from "@remix-run/react/routeModules";
import homeStyles from "~/styles/home/home.css";

export const links: LinksFunction = () => {

	return [
		{ rel: 'stylesheet', href: homeStyles },
	]
}
export default () => {

	return (
		<div className="home">
			<h1>Your Portfolio Management Tool</h1>

			<h4>YNAB for Investing</h4>

			<div className="home__links">
				<Link to={'/sign-in'}>Sign In</Link>
				<Link to={'/sign-up'}>Sign Up</Link>
			</div>
		</div>
	);

};
