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

			<div className="home__main">

				<h1>Your Portfolio Management Tool</h1>

				<h4>YNAB for Investing</h4>

				<div className="home__main__links">
					<Link to={'/sign-in'}>Sign In</Link>
					<Link to={'/sign-up'}>Sign Up</Link>
				</div>
			</div>

			<div className="home__about">
				<h3>Become your own Portfolio Manager</h3>
			</div>

			<div className="home__points">
				<h3>Gain Insight into Your Investment Journey</h3>
				<ul>
					<li>See all your assets</li>
					<li>Measure your total performance</li>
					<li>Track your FI journey</li>
				</ul>
			</div>
		</div>
	);

};
