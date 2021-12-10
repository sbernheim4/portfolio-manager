import { MongoClient } from 'mongodb';
import { MONGODB_PWD } from "../../env";

const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

const getDBConnection = async () => {

	try {

		const x = await client.connect();

		return x;

	} catch(err) {

		console.error(err);

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
	await getDBConnection();
	return client.db().collection('keys')
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
