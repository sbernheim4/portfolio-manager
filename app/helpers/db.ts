import { MongoClient } from 'mongodb';
import { Option } from "excoptional";
import { isBefore, isSameDay, isToday, subDays } from 'date-fns';
import { MONGODB_PWD } from "../env";
import { AccountBalances, AccountIdToValue, ItemIdToAccessToken, UserInfo, UserInfoKeys, UserInfoValues, XirrData } from '~/types/UserInfo.types';

const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> | undefined;

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

/**
 * Used when a new user is singing up for an account
 */
export const getNewUserInfo = (
	username: string,
	password: string,
	salt: string
): UserInfo => {
	return {
		accountBalances: [],
		itemIdToAccessToken: {},
		password,
		salt,
		user: username,
		xirrData: {
			xirrDataLastUpdatedOn: undefined,
			balance: undefined,
			xirr: null
		}
	};
};

export const getUserInfoCollection = async () => {
	const collectionName = "userInfo";

	if (activeConnection === undefined) {
		throw new Error("Could not connect to DB");
	}

	return activeConnection.then(mongoClient => {
		return mongoClient.db().collection(collectionName);
	});
};

/**
 * Retrieve a top level property from the DB for a given
 * user
 */
const getValueFromDB = async <T extends UserInfoValues>(
	username: string,
	property: UserInfoKeys
): Promise<T> => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;

	const value = userInfo[property];

	return value as T;
};

/**
 * helper function to retrieve multiple top level properties
 * from the db
 */
export const getValuesFromDB = async (
	username: string,
	properties: UserInfoKeys[]
): Promise<Record<UserInfoKeys, UserInfoValues>> => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;



	const data = properties.reduce((acc, prop) => {

		const value = userInfo[prop];

		return {
			...acc,
			[prop]: value
		}

	}, {} as Record<UserInfoKeys, UserInfoValues>);

	return data;
};

/**
 * Update top level properties in the DB for a given user
 */
const updateDB = async <T extends UserInfoValues>(
	username: string,
	name: UserInfoKeys,
	initialValue: T,
	fn: (userInfo: UserInfo) => T
) => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;

	const value = userInfo[name];

	if (userInfo === null || value === null || value === undefined) {

		// New User
		return userInfoCollection.insertOne({
			user: username,
			[name]: initialValue
		});

	} else {

		// Existing User
		const valueToInsert = fn(userInfo);

		return userInfoCollection.findOneAndUpdate(
			{ user: username },
			{ $set: { [name]: valueToInsert } }
		);

	}

};

/**
 * Saves an access token for an institutional account to the db
 */
export const saveNewAccessToken = async (
	username: string,
	accessToken: string,
	itemId: string
) => {

	updateDB(
		username,
		'itemIdToAccessToken',
		{ [itemId]: [accessToken] },
		(userInfo) => {

			const { itemIdToAccessToken } = userInfo;

			const accessTokensForItemId = itemIdToAccessToken[itemId];
			const newAccessTokenList = [...accessTokensForItemId, accessToken];

			const newItemIdToAccessToken = {
				...itemIdToAccessToken,
				[itemId]: newAccessTokenList
			};

			return newItemIdToAccessToken;
		}
	);

};

/**
 * Meant to be used only in the portfolio-balance
 * routeLoader
 */
export const getMostRecentAccountBalancesEntryDate = async (
	username: string
) => {

	const accountBalances = await getValueFromDB<AccountBalances>(
		username,
		'accountBalances'
	);

	const mostRecentEntry = accountBalances
		.map(x => x.date)
		.map(dateString => new Date(dateString))
		.sort((a, b) => {
			if (isSameDay(a, b)) {
				return 0;
			} else if (isBefore(a, b)) {
				return -1
			} else {
				return 1;
			}
		})[0];

	const today = new Date();

	return mostRecentEntry ?? subDays(today, 1);

};

export const saveAccountBalancesToDB = async (
	username: string,
	accountRecords: AccountIdToValue,
	totalBalance: number
) => {

	const newEntry = [{
		...accountRecords,
		totalBalance,
		date: new Date().toISOString()
	}] as AccountBalances;

	try {

		const accountBalances = await getValueFromDB<AccountBalances>(
			username,
			'accountBalances'
		);

		console.log({accountBalances});

		Option.of(
			accountBalances
				.map(x => x.date)
				.map(dateString => new Date(dateString))
				.sort((a, b) => {
					if (isSameDay(a, b)) {
						return 0;
					} else if (isBefore(a, b)) {
						return -1
					} else {
						return 1;
					}
				})
				.at(0)
		).map(mostRecentEntryDate => {

			if (!isToday(mostRecentEntryDate)) {

				const updateAccountBalances = () => {
					return accountBalances.length > 0 ?
						[...newEntry, ...accountBalances] :
						newEntry;
				};

				// Fire and forget
				updateDB(
					username,
					'accountBalances',
					newEntry,
					updateAccountBalances
				);

			}

		});

	} catch (err) {

		console.log("ERROR PULLING DATA FROM DB");
		throw err;

	}

};

export const getItemIdToAccessTokenFromDB = async (username: string) => {

	return getValueFromDB<ItemIdToAccessToken>(username, 'itemIdToAccessToken')

};

export const getAccessTokensFromDB = async (
	username: string
): Promise<Array<string>> => {

	const itemIdToAccessTokens = await getItemIdToAccessTokenFromDB(username);

	const accessTokens = Object.values(itemIdToAccessTokens).flatMap(x => x);

	return accessTokens;


};

export const updatePositionsLastUpdatedAt = (
	username: string,
	date: string,
	balance: number,
	xirr: number
) => {

	const updatedXirrData = {
		xirrDataLastUpdatedOn: date,
		balance,
		xirr
	};

	updateDB(
		username,
		"xirrData",
		updatedXirrData,
		() => updatedXirrData
	);

};

export const getAccountBalancesFromDB = async (
	username: string
) => {

	return getValueFromDB<AccountBalances>(
		username,
		'accountBalances'
	);

};

export const getXirrData = async (username: string) => {

	return await getValueFromDB<XirrData>(
		username,
		'xirrData'
	);

};
