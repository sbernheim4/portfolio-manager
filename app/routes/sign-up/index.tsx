import bcrypt from 'bcryptjs';
import signUpStyles from './../../styles/signUp.css'
import { ActionFunction, LinksFunction, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { UserInfo } from "~/types/UserInfo.types";
import { commitSession, getSession } from "~/helpers/session";
import { getNewUserInfo, getUserInfoCollection } from "~/helpers/db.server";

export const usernameAlreadyExists = async (username: string) => {

	const userInfoCollection = await getUserInfoCollection();
	const userInfo = await userInfoCollection.findOne({
		user: username
	}) as unknown as UserInfo | null;

	// userInfo is null iff no user with the given username is found

	return userInfo === null ?
		false :
		true

};

export const saveNewUser = async (
	username: string,
	hashedPassword: string,
	salt: string
) => {

	const initalUserData = getNewUserInfo(username, hashedPassword, salt);

	const userInfoCollection = await getUserInfoCollection();

	return await userInfoCollection.insertOne(initalUserData);

};

export const hashPassword = async (
	password: string
) => {

	const saltRounds = 10;

	try {

		const salt = await bcrypt.genSalt(saltRounds);
		const hashedPassword = bcrypt.hashSync(password, salt)

		return {
			hashedPassword,
			salt,
			isError: false,
			error: undefined,
			errorMessage: undefined

		};

	} catch (error) {

		return {
			hashedPassword: undefined,
			salt: undefined,
			isError: true,
			error,
			errorMessage: "Error hashing password"
		};

	}

};


export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: signUpStyles }
	];
};

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const username = formData.get("username") as string
	const password = formData.get("password") as string;

	if (await usernameAlreadyExists(username)) {
		return {
			isError: true,
			error: "Username already exists - Please try again with a new username",
			errorMessage: "Username already exists - Please try again with a new username"
		}
	}

	const {
		isError,
		error,
		errorMessage,
		hashedPassword,
		salt
	} = await hashPassword(password);

	if (isError) {
		return {
			isError,
			error,
			errorMessage
		};
	}

	// Save the user in the DB
	await saveNewUser(username, hashedPassword as string, salt as string);

	// Save the new user in the session
	const session = await getSession(request.headers.get("Cookie"));
	const cookie = await commitSession(session);
	session.set("userId", username);

	// Redirect the now logged in user to the home page with the session cookie
	return redirect(
		"/",
		{ headers: { "Set-Cookie": cookie } }
	);

};

const CreateAccount = () => {
	const actionData = useActionData<{
		isError: boolean,
		error: string | Error,
		errorMessage: string
	}>();

	return (
		<div className="signup">
			<h2 className="signup--header">Create Account</h2>

			{
				actionData?.isError === true ?
					<h1>{actionData?.errorMessage}</h1> :
					null
			}

			<Form method="post">
				<label>
					Username:
					<br />
					<input placeholder="johnsmith" type="text" name="username" />
				</label>

				<label>
					Password:
					<br />
					<input type="password" name="password" />
				</label>

				<input className="signup--submit" value="Create Account" type="submit" name="Submit" />
			</Form>

		</div>
	);

};

export default CreateAccount
