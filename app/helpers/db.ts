import { MongoClient } from 'mongodb';
import { MONGODB_PWD } from "../../env";

const userId = "sams-unique-user-id-12345";
const collectionName = "userInfo";

const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri).connect().then(x => activeConnection = x);
let activeConnection: MongoClient;

const getDBConnection = async () => {

	if (activeConnection !== undefined) {

		return activeConnection;
	}

	try {

		console.log("creating new connection");

		return client
			.then(x => {
				activeConnection = x
				return activeConnection;
			})

	} catch(err) {

		client.then(x => x.close());

	}

};

const retrieveStoredAccessTokens = async () => {

    try {
        const keysCollection = await getKeysCollection();
        const existingTokens = await keysCollection.findOne({ user: userId });

        if (existingTokens === null) {
            return [];
        }

        return existingTokens.accessTokens as Array<string>;
    } catch (err) {
        console.log("ERR", err);
        return [];
    }

};

const getKeysCollection = async () => {

	const connection = await getDBConnection();

	if (!connection) {
		throw new Error("Could not connect to DB");
	}

	return connection.db().collection(collectionName);
};

const saveNewAccessToken = async (accessToken: string) => {

	const keysCollection = await getKeysCollection();
	const existingTokens = await keysCollection.findOne({ user: userId});

	if (existingTokens === null) {
        console.log("No existing tokens found");

		// New User
		return keysCollection.insertOne({
			user: userId,
			accessTokens: [accessToken]
		});

	} else {
        console.log("Updating existing user's tokens");

		// Existing User
		const storedAccessTokens = existingTokens.accessTokens;
		const updatedAccessTokens = [...storedAccessTokens, accessToken];

		return keysCollection.findOneAndUpdate(
            { user: userId },
            { $set: { accessTokens: updatedAccessTokens } }
		);

	}

};

export {
    retrieveStoredAccessTokens,
    saveNewAccessToken
}
