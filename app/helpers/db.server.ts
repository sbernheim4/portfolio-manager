import { MongoClient } from 'mongodb';
import { Option } from "excoptional";
import { isBefore, isSameDay, isToday, subDays } from 'date-fns';
import { AccountBalances, AccountIdToValue, CachedPlaidAccountBalances, ItemIdToAccessToken, UserInfo, UserInfoKeys, UserInfoValues, XirrData } from '~/types/UserInfo.types';
import { getEnvVar } from './getEnvVar';
import { AccountBase } from 'plaid';

const URI = `mongodb+srv://portfolio-manager:${getEnvVar('MONGODB_PWD')}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(URI);
const connection = client.connect();
const COLLECTION_NAME = "userInfo";

/**
 * Used when a new user is singing up for an account
 */
export const getNewUserInfo = (
	username: string,
	password: string,
	salt: string
): UserInfo => {
	return {
		cachedPlaidAccountBalances: {
			lastUpdated: '',
			accountBalanceData: []
		},
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

/**
 * Retrieves a connection to the database that can then be used for queries and
 * updates.
 */
export const getUserInfoCollection = async () => {
	const connect = connection;

	if (connect === undefined) {
		console.log('could not connect to DB.');
		throw new Error("Could not connect to DB");
	}

	return connect.then(mongoClient => {

		const collection = mongoClient.db().collection(COLLECTION_NAME);

		return collection;

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
 * Removes a Plaid Item ID from a user's account.
 * Used for unlinking an account (or maybe an institution?).
 */
export const removeItemId = async (username: string, itemId: string) => {

	const itemIdToAccessTokens = await getItemIdToAccessTokenFromDB(username);

	delete itemIdToAccessTokens[itemId]

	return updateDB(
		username,
		'itemIdToAccessToken',
		itemIdToAccessTokens,
		() => itemIdToAccessTokens
	);

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

			const accessTokensForItemId = itemIdToAccessToken[itemId] ?? [];

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

	const accountBalances = await getAccountBalancesFromDB(username);

	const mostRecentEntry = accountBalances
		.map(x => x.date)
		.map(dateString => new Date(dateString))
		.sort((a, b) => {
			if (isSameDay(a, b)) {
				return 0;
			} else if (isBefore(a, b)) {
				return 1
			} else {
				return -1;
			}
		})[0];

	const today = new Date();

	return mostRecentEntry ?? subDays(today, 1);

};

/**
 * Updates the user's account balance stored data.
 */
// TODO: Hash the balance data string value (totalBalance and the keys of todaysBalanceData).
export const saveAccountBalancesToDB = async (
	username: string,
	todaysBalanceData: AccountIdToValue,
	totalBalance: number
) => {

	const newEntry = [{
		...todaysBalanceData,
		totalBalance,
		date: new Date().toISOString()
	}] as AccountBalances;

	try {

		const accountBalances = await getAccountBalancesFromDB(username);

		const mostRecentAccountBalanceEntry = accountBalances
			.map(x => x.date)
			.map(dateString => new Date(dateString))
			.sort((a, b) => {
				if (isSameDay(a, b)) {
					return 0;
				} else if (isBefore(a, b)) {
					return 1
				} else {
					return -1;
				}
			}).at(0);

		const updatedAccountBalances = Option.of(mostRecentAccountBalanceEntry)
			.map(mostRecentEntryDate => {

				return !isToday(mostRecentEntryDate) ?
					[...newEntry, ...accountBalances] :
					accountBalances;

			}).getOrElse(newEntry);


		// Fire and forget
		updateDB(
			username,
			'accountBalances',
			updatedAccountBalances,
			() => updatedAccountBalances
		);


	} catch (err) {

		console.log("ERROR PULLING DATA FROM DB");
		// throw err;
		return null;

	}

};

/**
 * Retrieves the Item ID to access token object from the database.
 */
export const getItemIdToAccessTokenFromDB = async (username: string) => {

	return getValueFromDB<ItemIdToAccessToken>(username, 'itemIdToAccessToken')

};

/**
 * Returns all the access tokens the user has stored.
 *
 * Each access token represents a linked account.
 *
 * A single institution (represented by an Item ID) can have multiple linked
 * accounts (checking, savings, brokerage accounts at the same institution for
 * example).
 */
export const getAccessTokensFromDB = async (
	username: string
): Promise<Array<string>> => {

	const itemIdToAccessTokens = await getItemIdToAccessTokenFromDB(username);

	const accessTokens = Object.values(itemIdToAccessTokens).flatMap(x => x);

	return accessTokens;


};

/**
 * Saves new XIRR data to the DB.
 */
export const updateXirrData = (
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

/**
 * Retrieves account balance data stored in the DB.
 */
export const getAccountBalancesFromDB = async (
	username: string
) => {

	const accountBalances = await getValueFromDB<AccountBalances>(
		username,
		'accountBalances'
	);

	// TODO: Unhash the blance data response. The property totalBalance in
	// accountBalances, along with all the values of the remaining keys that are
	// neither totalBalance and date.

	return accountBalances;

};

/**
 * Retrieves XIRR data stored in the DB.
 */
export const getXirrDataFromDB = async (username: string) => {

	const xirrData = await getValueFromDB<XirrData>(
		username,
		'xirrData'
	);

	return xirrData;

};

export const getCachedAccountBalancesFromDB = async (username: string) => {

	const cachedAccountBalanceData = await getValueFromDB<CachedPlaidAccountBalances>(
		username,
		'cachedPlaidAccountBalances'
	);

	return cachedAccountBalanceData;

};

export const cacheAccountBalanceData = async (
	username: string,
	accountBalanceData: AccountBase[]
) => {

	const accountBalanceDataWithDate = {
		lastUpdated: new Date().toISOString(),
		accountBalanceData
	};

	const result = await updateDB(
		username,
		'cachedPlaidAccountBalances',
		accountBalanceDataWithDate,
		() => accountBalanceDataWithDate
	);

	return result;
};

export const toCachedPlaidUtil = async <T>(
	username: string,
	key: UserInfoKeys,
	plaidUtilFn: (username: string) => Promise<T>,
	dBCacheCheckFn: () => Promise<T & { lastUpdated: string}>
) => {

	const hof = async <PlaidUtilReturnType>() => {


		const cachedData = await dBCacheCheckFn();
		const cachedDataDate = new Date(cachedData.lastUpdated);
		if (isToday(cachedDataDate)) {
			const res = cachedData[key];
			return res;
		}

		const result = await plaidUtilFn<PlaidUtilReturnType>(username);

		const resultWithDate = {
			lastUpdated: new Date().toISOString(),
			[key]: result
		};

		await updateDB(
			username,
			key,
			// @ts-ignore
			resultWithDate,
			() => resultWithDate
		);

		return result;

	};

	return hof;

};
