import { LinksFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useWindowSize } from "~/hooks/useWindowSize";
import navbarStlyes from "./styles/navbar.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: navbarStlyes }
	];
};

export const Navbar = () => {

	const { width } = useWindowSize();
	const [Navbar, setNavbar] = useState(DesktopNavbar);

	useEffect(() => {

		if (width === undefined) {
			return
		};

		if (width > 600) {
			setNavbar(DesktopNavbar);
		} else {
			setNavbar(MobileNavbar);
		}

	}, [width])

	return Navbar
};

const MobileNavbar = () => {

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/investments"}>Investments</Link>
			<Link to={"/logout"}>Log Out</Link>
		</nav>
	)

};


const DesktopNavbar = () => {

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/accounts"}>Accounts</Link>
			<Link to={"/investments"}>Investments</Link>
			<Link to={"/portfolio-balance"}>Portfolio Balance</Link>
			<Link to={"/manage-accounts"}>Manage Accounts</Link>
			<Link to={"/logout"}>Log Out</Link>
		</nav>
	)

};
