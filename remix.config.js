import {
	createRoutesFromFolders,
} from "@remix-run/v1-route-convention";

/** @type {import('@remix-run/dev').AppConfig} */
export default {
	appDirectory: "app",
	assetsBuildDirectory: "public/build",
	publicPath: "/build/",
	ignoredRouteFiles: [".*"],
	routes(defineRoutes) {
		// uses the v1 convention, works in v1.15+ and v2
		return createRoutesFromFolders(defineRoutes);
	},
	browserNodeBuiltinsPolyfill: {
		modules: {
			crypto: true
		}
	}
};
