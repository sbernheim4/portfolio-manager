export const isClientSideJSEnabled = () => {
	try {
		const hasJS = !!document;
		return hasJS;
	} catch {
		return false;
	}
};

