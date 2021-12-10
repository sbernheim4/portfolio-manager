// Global store - would be replaced by a DB
export const tokenMappings = new Map<string, string[]>();

const getTokenMap = () => tokenMappings;

const appendNewToken = (key: string, newValue: string) => {

    if (!tokenMappings.get(key)) {
        tokenMappings.set(key, []);
    };

    const value = tokenMappings.get(key) as Array<string>

    const newValues = [...value, newValue];

    tokenMappings.set(key, newValues);
};

const deleteEntry = (key: string) => {
    return tokenMappings.delete(key);
};

const getEntry = (key: string) => {

    return tokenMappings.get(key);

};

export {
    getTokenMap,
    appendNewToken,
    getEntry,
    deleteEntry
};

class Storage {
	private static _instance: Storage;
	private constructor() {
		private map = new Map();
	};

	public static get Instance() {
		return this._instance || (this._instance = new this());
	}
};
