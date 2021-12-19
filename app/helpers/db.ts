import { MongoClient } from 'mongodb';
import { MONGODB_PWD } from "../../env";

const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> = (async () => await client.connect())();

const getDBConnection = async () => {

	if (activeConnection !== undefined) {

		return await activeConnection;
	}

	try {

		console.log("creating new connection");

		activeConnection = await client.connect();

		return activeConnection;

	} catch(err) {

		console.error(err);

		activeConnection.then(res => res.close());
		client.close();

	}

};

const retrieveStoredAccessTokens = async (userId = "sams_token") => {

	const keysCollection = await getKeysCollection();
	const existingTokens = await keysCollection.findOne({ user: userId });

	if (existingTokens === null) {
		return [];
	}

	return existingTokens.accessTokens as Array<string>;

};

const getKeysCollection = async () => {

	const connection = await getDBConnection();

	if (!connection) {
		throw new Error("Could not connect to DB");
	}

	return connection.db().collection('keys')
};

const saveNewAccessToken = async (accessToken: string, userId = "sams_tokens") => {

	const keysCollection = await getKeysCollection();
	const existingTokens = await keysCollection.findOne({ user: userId});

	if (existingTokens === null) {

		// New User
		return keysCollection.insertOne({
			user: userId,
			accessTokens: [accessToken]
		});

	} else {

		// Existing User
		const storedAccessTokens = existingTokens.accessTokens;
		const updatedAccessTokens = [...storedAccessTokens, accessToken];

		return keysCollection.updateOne({ user: userId }, {accessTokens: updatedAccessTokens});

	}

};

export {
    retrieveStoredAccessTokens,
    saveNewAccessToken
}
