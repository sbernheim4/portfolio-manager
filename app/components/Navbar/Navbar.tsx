import { Link, LinksFunction } from "remix";
import navbarStlyes from "./navbar.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: navbarStlyes }
	];
};

export const Navbar = () => {

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/account"}>Accounts</Link>
			<Link to={"/positions"}>Positions</Link>
			<Link to={"/link-account"}>Linked Accounts</Link>
		</nav>
	)

};
