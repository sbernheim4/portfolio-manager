import { MongoClient } from 'mongodb';
import { Option } from "excoptional";
import { isToday } from 'date-fns';
import { MONGODB_PWD } from "../env";

const collectionName = "userInfo";
const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> | undefined;

type AccountId = string;
export type UserInfo = {
    accountBalances: Array<{
        // @ts-ignore
        "date": string,
        "totalBalance": number;
        [key: AccountId]: number
    }>; // Array<AccountBalance>
    balances: Array<{ date: string, balances: number }>
    itemIdToAccessToken: Record<string, string>;
    lastAccessed: string;
    password: string;
    salt: string;
    user: string;
};

/**
 * Used when a new user is singing up for an account
 */
export const getNewUserInfo = (username: string, password: string, salt: string): UserInfo => {
    return {
        accountBalances: [],
        balances: [],
        itemIdToAccessToken: {},
        lastAccessed: "",
        password,
        salt,
        user: username
    };
}

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

// TODO Update call sites to pass in username
export const retrieveItemIdToAccessTokenMap = async (username: string) => {

    try {

        const userInfoCollection = await getUserInfoCollection();
        const userInfo = await userInfoCollection.findOne({ user: username });

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

// TODO Update call sites to pass in username
export const retrieveStoredAccessTokens = async (username: string) => {

    try {

        const userInfoCollection = await getUserInfoCollection();
        const userInfo = await userInfoCollection.findOne({ user: username });

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

export const getUserInfoCollection = async () => {

    // const connection = await getDBConnection();

    if (activeConnection === undefined) {
        throw new Error("Could not connect to DB");
    }

    return activeConnection.then(mongoClient => {
        return mongoClient.db().collection(collectionName);
    });
};

const updateDB = async <T>(
    username: string,
    name: string,
    initialValue: T,
    fn: (userInfo: UserInfo) => T
) => {

    const userInfoCollection = await getUserInfoCollection();
    const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;

    // @ts-ignore
    const nestedData = userInfo[name];

    if (userInfo === null || nestedData === null || nestedData === undefined) {

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

export const saveNewAccessToken = async (username: string, accessToken: string, itemId: string) => {

    updateDB(username, 'itemIdToAccessToken', { [itemId]: accessToken }, (userInfo) => {

        // Existing User
        const { itemIdToAccessToken } = userInfo;

        const newItemIdToAccessToken = {
            ...itemIdToAccessToken,
            [itemId]: accessToken
        };

        return newItemIdToAccessToken;

    });

};

type AccountBalance = number;

export const saveAccountBalancesToDB = (
    username: string,
    accountRecords: Record<AccountId, AccountBalance>,
    totalBalance: number
) => {

    const newEntry = [{
        ...accountRecords,
        totalBalance,
        date: new Date().toISOString()
    }];

    updateDB(username, 'accountBalances', newEntry, (userInfo) => {

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

export const getAccountBalancesFromDB = async (username: string) => {

    const userInfoCollection = await getUserInfoCollection();
    const userInfo = await userInfoCollection.findOne({ user: username }) as unknown as UserInfo;

    const { accountBalances } = userInfo;

    return accountBalances;

};

export const updateLastAccessed = async (username: string, date: Option<string>) => {

    date.map(d => {
        updateDB(username, "positionsLastUpdatedAt", d, () => d);
    });

};
