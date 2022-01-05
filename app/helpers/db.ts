import { MongoClient } from 'mongodb';
import { isToday } from 'date-fns';
import { MONGODB_PWD } from "../env";

const userId = "sams-unique-user-id-12345";
const collectionName = "userInfo";
const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> | undefined;

type UserInfo = {
	lastAccessed: string;
	user: string;
	itemIdToAccessToken: Record<string, string>;
	balances: Array<{ date: string, balances: number }>
	accountBalances: Array<{
		// @ts-ignore
		"date": string,

		"totalBalance": number;
		[key: string]: number
	}>; // Array<AccountBalance>
};

try {

	if (activeConnection === undefined) {

		console.log("creating new connection");

		activeConnection = client.connect();

	}

} catch (err) {

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
	const userInfo = await userInfoCollection.findOne({ user: userId }) as unknown as UserInfo;

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
			{ $set: { [name]: valueToInsert } }
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

type AccountId = string;
type AccountBalance = number;
export const saveAccountBalancesToDB = (
	accountRecords: Record<AccountId, AccountBalance>,
	totalBalance: number
) => {

	const newEntry = [{
		...accountRecords,
		totalBalance,
		date: new Date().toISOString()
	}];

	updateDB('accountBalances', newEntry, (userInfo) => {

		const { accountBalances } = userInfo;

		if (accountBalances.length) {
			const lastEntry = accountBalances[accountBalances.length - 1];
			const mostRecentEntry = new Date(lastEntry.date)

			return isToday(mostRecentEntry) ?
				accountBalances :
				[
					...accountBalances,
					...newEntry
				];

		} else {

			return newEntry;

		}

	});


};

export const getAccountBalancesFromDB = async () => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: userId }) as unknown as UserInfo;

	const { accountBalances } = userInfo;

	return accountBalances;

};

export const updateLastAccessed = async (date: string) => {
	console.log({ date });
	updateDB("lastAccessed", date, () => date);
};
