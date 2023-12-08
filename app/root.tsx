import * as React from "react";
import type { ActionFunction, LinksFunction, LoaderFunctionArgs } from "@remix-run/node";

import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLoaderData,
	useLocation,
	useRouteError,
} from "@remix-run/react";

import globalStylesUrl from "~/styles/global.css";
import {
	Navbar,
	action as navbarAction,
	loader as navbarLoader,
	links as navbarStyles
} from "./components/Navbar/Navbar";

/**
 * The `links` export is a function that returns an array of objects that map to
 * the attributes for an HTML `<link>` element. These will load `<link>` tags on
 * every route in the app, but individual routes can include their own links
 * that are automatically unloaded when a user navigates away from the route.
 *
 * https://remix.run/api/app#links
 */
export const links: LinksFunction = () => {
	return [
		...navbarStyles(),
		{ rel: "stylesheet", href: globalStylesUrl },
	];
};

export const loader = (args: LoaderFunctionArgs) => {
	return navbarLoader(args);
}

export const action: ActionFunction = async (args) => {

	return navbarAction(args)
}

/**
 * The root module's default export is a component that renders the current
 * route via the `<Outlet />` component. Think of this as the global layout
 * component for your app.
 */
export default function App() {

	const data = useLoaderData<typeof loader>();

	return (
		<Document>
			<Navbar isLoggedOut={data.isLoggedOut} />
			<Outlet />
		</Document>
	);
}

function Document({
	children,
	title
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<RouteChangeAnnouncement />
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === "development" && <LiveReload />}
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	// when true, this is what used to go to `CatchBoundary`
	if (isRouteErrorResponse(error)) {
		return (
			<div>
				<h1>Oops</h1>
				<p>Status: {error.status}</p>
				<p>{error.data.message}</p>
			</div>
		);
	}

	// Don't forget to typecheck with your own logic.
	// Any value can be thrown, not just errors!
	let errorMessage = "Unknown error";
	// if (isDefinitelyAnError(error)) {
	// 	errorMessage = error.message;
	// }

	return (
		<div>
			<h1>Uh oh ...</h1>
			<p>Something went wrong.</p>
			<pre>{errorMessage}</pre>
		</div>
	);
}

/**
 * Provides an alert for screen reader users when the route changes.
 */
const RouteChangeAnnouncement = React.memo(() => {
	const [hydrated, setHydrated] = React.useState(false);
	const [innerHtml, setInnerHtml] = React.useState("");
	const location = useLocation();

	React.useEffect(() => {
		setHydrated(true);
	}, []);

	const firstRenderRef = React.useRef(true);
	React.useEffect(() => {
		// Skip the first render because we don't want an announcement on the
		// initial page load.
		if (firstRenderRef.current) {
			firstRenderRef.current = false;
			return;
		}

		const pageTitle = location.pathname === "/" ? "Home page" : document.title;
		setInnerHtml(`Navigated to ${pageTitle}`);
	}, [location.pathname]);

	// Render nothing on the server. The live region provides no value unless
	// scripts are loaded and the browser takes over normal routing.
	if (!hydrated) {
		return null;
	}

	return (
		<div
			aria-live="assertive"
			aria-atomic
			id="route-change-region"
			style={{
				border: "0",
				clipPath: "inset(100%)",
				clip: "rect(0 0 0 0)",
				height: "1px",
				margin: "-1px",
				overflow: "hidden",
				padding: "0",
				position: "absolute",
				width: "1px",
				whiteSpace: "nowrap",
				wordWrap: "normal"
			}}
		>
			{innerHtml}
		</div>
	);
});
