import { MongoClient } from 'mongodb';
import { isToday } from 'date-fns';
import { MONGODB_PWD } from "../env";

const userId = "sams-unique-user-id-12345";
const collectionName = "userInfo";
const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> | undefined;

type UserInfo = {
	user: string;
	itemIdToAccessToken: Record<string, string>;
	balances: Array<{date: string, balances: number}>
};

try {

	if (activeConnection === undefined) {

		console.log("creating new connection");

		activeConnection = client.connect();

	}

} catch(err) {

	if (activeConnection !== undefined) {
		activeConnection.then(x => x.close());
	}

}

export const retrieveItemIdToAccessTokenMap = async () => {

	try {

		const userInfoCollection = await getUserInfoCollection();
		const userInfo = await userInfoCollection.findOne({ user: userId });

		if (userInfo === null) {
			return {};
		}

		const { itemIdToAccessToken } = userInfo;

		return itemIdToAccessToken as Record<string, string[]>;


	} catch (err) {

		console.log("ERR", err);

		return {};

	}

};

export const retrieveStoredAccessTokens = async () => {

	try {

		const userInfoCollection = await getUserInfoCollection();
		const userInfo = await userInfoCollection.findOne({ user: userId });

		if (userInfo === null) {
			return [];
		}

		const { itemIdToAccessToken } = userInfo;

		const res = Object.values(itemIdToAccessToken);

		return res as string[];

	} catch (err) {

		console.log("ERR", err);

		return [];

	}

};

const getUserInfoCollection = async () => {

	// const connection = await getDBConnection();

	if (activeConnection === undefined) {
		throw new Error("Could not connect to DB");
	}

	return activeConnection.then(x => {
		return x.db().collection(collectionName);
	});
};

const updateDB = async <T>(name: string, initialValue: T, fn: (userInfo: UserInfo) => T) => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: userId}) as unknown as UserInfo;

	// @ts-ignore
	const nestedData = userInfo[name];

	if (userInfo === null || nestedData === null || nestedData === undefined) {

		// New User
		return userInfoCollection.insertOne({
			user: userId,
			[name]: initialValue
		});

	} else {

		// Existing User
		const valueToInsert = fn(userInfo);

		return userInfoCollection.findOneAndUpdate(
			{ user: userId },
			{ $set: { [name]:  valueToInsert } }
		);

	}

};

export const saveNewAccessToken = async (accessToken: string, itemId: string) => {

	updateDB('itemIdToAccessToken', { [itemId]: accessToken }, (userInfo) => {

		// Existing User
		const { itemIdToAccessToken } = userInfo;

		const newItemIdToAccessToken = {
			...itemIdToAccessToken,
			[itemId]: accessToken
		};

		return newItemIdToAccessToken;

	});

};

export const saveNetworthToDB = async (newBalance: number) => {

	const newDataPoint = [{
		date: new Date().toISOString(),
		balances: newBalance
	}];

	updateDB('balances', newDataPoint, (userInfo) => {

		const { balances } = userInfo;

		if (balances.length) {
			const lastEntry = balances[balances.length - 1];
			const mostRecentEntry = new Date(lastEntry.date)

			return isToday(mostRecentEntry) ?
				balances :
				[...balances, ...newDataPoint];
		} else {

			return newDataPoint;

		}

	});

};

export const getNetworthFromDb = async () => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: userId }) as unknown as UserInfo;

	const { balances } = userInfo;

	return balances;

};
