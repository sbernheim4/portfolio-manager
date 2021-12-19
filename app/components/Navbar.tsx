import { Link } from "remix";

export const Navbar = () => {

	return (
		<nav>
			<Link to={"/dashboard"}>Dashboard</Link>
			<Link to={"/account"}>Accounts</Link>
			<Link to={"/holding"}>Positions</Link>
		</nav>
	)

};
