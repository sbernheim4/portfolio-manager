import { LinksFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import navbarStlyes from "./styles/navbar.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: navbarStlyes }
	];
};

export const Navbar = () => {

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/accounts"}>Accounts</Link>
			<Link to={"/positions"}>Positions</Link>
			<Link to={"/portfolio-balance"}>Portfolio Balance</Link>
			<Link to={"/manage-accounts"}>Manage Accounts</Link>
			<Link to={"/logout"}>Log Out</Link>
		</nav>
	)

};
