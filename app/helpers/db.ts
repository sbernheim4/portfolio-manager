import { MongoClient } from 'mongodb';
import { MONGODB_PWD } from "../env";

const userId = "sams-unique-user-id-12345";
const collectionName = "userInfo";
const uri = `mongodb+srv://portfolio-manager:${MONGODB_PWD}@cluster0.bvttm.mongodb.net/plaid?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let activeConnection: Promise<MongoClient> | undefined;

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

	// const connection = await getDBConnection();

	if (activeConnection === undefined) {
		throw new Error("Could not connect to DB");
	}

	return activeConnection.then(x => {
		return x.db().collection(collectionName);
	});
};

const saveNewAccessToken = async (accessToken: string) => {

	const keysCollection = await getKeysCollection();
	const existingTokens = await keysCollection.findOne({ user: userId});

	if (existingTokens === null) {

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
