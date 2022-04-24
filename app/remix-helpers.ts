import { AppLoadContext, LoaderFunction, redirect } from "@remix-run/node";
import { isLoggedOut } from "./routes/login";

// Copied from node_modules/react-router/index.d.ts
export declare type Params<Key extends string = string> = {
	readonly [key in Key]: string | undefined;
};

// Copied from node_modules/@remix-run/server-runtime/routeModules.d.ts
type LoaderArgs = { request: Request, context: AppLoadContext, params: Params };

/**
 * HOF for wrapping loader functions that will first perform a logged in check
 * for routes that need it.
 * @param loaderFunction
 * The loader function to be wrapped. Be sure to pass it directly, not invoked.
 * This can be done most simply by directly wrapping the loader function with
 * loaderWithLogin (example 1), or by inlining (example 2), or by storing the
 * function in variables (example 3).
 *
 * @example
 * export const loader: LoaderFunction = loaderWithLogin(async (args) => {
 *     return 42;
 * });
 *
 * @example
 * export const loader: LoaderFunction = async (args) => {
 *
 *     return loaderWithLogin(async () => {
 *         // Loader function with API/Network/Function calls here
 *     })(args);
 * }
 *
 * @example
 * const routeLoader: LoaderFunction = (args) => {
 *     return 42;
 * }
 *
 * export const loader: LoaderFunction = (args) => {
 *     return loaderWithLogin(routeLoader)(args);
 * }
 * */
export const loaderWithLogin = (loaderFunction: LoaderFunction): LoaderFunction => {

	return async (args: LoaderArgs) => {

		const request = args.request;

		if (await isLoggedOut(request)) {
			return redirect("/login");
		}

		return loaderFunction(args);

	};
};
