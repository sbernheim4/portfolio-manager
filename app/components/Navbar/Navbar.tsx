import { ActionFunction, json, LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { isLoggedOut } from "~/helpers/isLoggedOut";
import { useWindowSize } from "~/hooks/useWindowSize";
import { validateIsLoggedIn } from "~/remix-helpers";
import navbarStlyes from "./styles/navbar.css";

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: navbarStlyes }
	];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {

	const isLoggedOutV = await isLoggedOut(request);

	const response = json({ isLoggedOut: isLoggedOutV })

	return response;

};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");

	switch (action) {
		case 'isLoggedIn':
			await validateIsLoggedIn(request);
	}
}

export const Navbar = (props: { isLoggedOut: boolean }) => {

	const { isLoggedOut } = props;

	const { width } = useWindowSize();
	const [Navbar, setNavbar] = useState(DesktopNavbar(isLoggedOut));

	useEffect(() => {

		if (width === undefined) {
			return
		};

		if (width > 600) {
			setNavbar(DesktopNavbar(isLoggedOut));
		} else {
			setNavbar(MobileNavbar(isLoggedOut));
		}

	}, [width])

	return Navbar
};

const MobileNavbar = (isLoggedOut: boolean) => {

	const linkUrl = isLoggedOut ? '/sign-in' : '/logout';
	const linkText = isLoggedOut ? 'Log In' : 'Log Out';

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/investments"}>Investments</Link>
			<Link to={linkUrl}>{linkText}</Link>
		</nav>
	)

};


const DesktopNavbar = (isLoggedOut: boolean) => {

	const linkUrl = isLoggedOut ? '/sign-in' : '/logout';
	const linkText = isLoggedOut ? 'Log In' : 'Log Out';

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/accounts"}>Accounts</Link>
			<Link to={"/investments"}>Investments</Link>
			<Link to={"/portfolio-balance"}>Portfolio Balance</Link>
			<Link to={"/manage-accounts"}>Manage Accounts</Link>
			<Link to={linkUrl}>{linkText}</Link>
		</nav>
	)

};
