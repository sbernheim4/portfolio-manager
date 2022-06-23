import { Option, Some } from "excoptional";
import { CountryCode, Institution, Products } from "plaid";
import { useState, useCallback, useEffect } from "react";
import { PlaidLinkOptionsWithLinkToken, usePlaidLink } from "react-plaid-link";

import {
	ActionFunction,
	json,
	LinksFunction,
	LoaderFunction,
	MetaFunction
} from "@remix-run/node";

import { useLoaderData, useSubmit } from "@remix-run/react";
import { createPlaidLinkToken, exchangePublicTokenForAccessToken, getPlaidLinkedInstitutions, unlinkPlaidItem } from "~/helpers/plaidUtils";
import { saveNewAccessToken } from "~/helpers/db.server";
import { LinkedInstitutions, links as linkedAccountStyles } from "~/components/LinkedInstitutions/LinkedInstitutions";
import { getUserNameFromSession } from "~/helpers/session";
import { validateIsLoggedIn } from "~/remix-helpers";
import manageAccountStyles from '~/styles/manage-accounts/manage-accounts.css';
import { useLoggedIn } from "~/hooks/useLoggedIn";

export const meta: MetaFunction = () => {
	return {
		title: "Manage your connected accounts",
		description: "Manage and link your bank accounts"
	};
};

export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: manageAccountStyles },
		...linkedAccountStyles(),
	];
};

export type LinkedInstitutionsResponse = {
	itemId: string;
	institution: Institution;
}[]

type ManageAccountsLoader = {
	linkedInstitutions: LinkedInstitutionsResponse;
	linkToken: string;
};

export const loader: LoaderFunction = async ({ request }) => {
	await validateIsLoggedIn(request);

	const username = await getUserNameFromSession(request);
	const linkedInstitutions = await getPlaidLinkedInstitutions(username);

	// The logged in user's unique id
	// const { id: clientUserId } = await User.find(...);
	const clientUserId = "5a24ca6a4e95b836d37e37fe"

	const plaidRequest = {
		user: {
			// This should correspond to a unique id for the current user.
			client_user_id: clientUserId,
		},
		client_name: 'Portfolio Manager',
		products: [Products.Auth, Products.Investments, Products.Transactions],
		language: 'en',
		webhook: 'https://webhook.example.com',
		country_codes: [CountryCode.Us],
	};

	const createLinkTokenResponse = await createPlaidLinkToken(plaidRequest);

	return json<ManageAccountsLoader>(
		{
			linkedInstitutions,
			linkToken: createLinkTokenResponse
		},
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

export const action: ActionFunction = async ({ request }) => {

	const formData = await request.formData();
	const action = formData.get("_action");
	const username = await getUserNameFromSession(request);

	switch (action) {
		case "linkAccount":
			const publicToken = formData.get("public_token") as string;
			const {
				access_token,
				error,
				item_id
			} = await exchangePublicTokenForAccessToken(publicToken);

			if (error) {

				console.log('error making an access token');

				return json({
					error: 'error making an access token'
				});

			}

			await saveNewAccessToken(username, access_token, item_id);

			return json(
				{ added: true },
				{ headers: { 'Clear-Site-Data': "cache" } }
			);
		case "unlinkAccount":

			const itemId = formData.get("itemId") as string;

			unlinkPlaidItem(username, itemId);

			return json(
				{ cleared: true },
				{ headers: { 'Clear-Site-Data': "cache" } }
			);

		default:
			console.log({
				action,
				request: request.url
			})
			console.log("whoops, uncaught action type");
			return null
	}
};

const Link = (props: { linkToken: string, setPublicToken: React.Dispatch<React.SetStateAction<Option<string>>> }) => {

	const onSuccess = useCallback((public_token, _metadata) => {

		console.log('onSuccessCallback called');

		props.setPublicToken(Some(public_token));

	}, []);


	const config: PlaidLinkOptionsWithLinkToken = {
		token: props.linkToken,
		onSuccess,
	};

	const { open, ready } = usePlaidLink(config);

	return (
		<>
			<button onClick={() => open()} disabled={!ready}>
				Link an Account
			</button>
		</>
	);

};


const LinkAccount = () => {

	useLoggedIn();

	const loaderData = useLoaderData<ManageAccountsLoader>();
	const submit = useSubmit();
	const [publicTokenOpt, setPublicToken] = useState(Option.of<string>());
	const { linkToken, linkedInstitutions } = loaderData;

	useEffect(() => {

		publicTokenOpt.map(async (publicToken) => {

			const data = new FormData();

			data.set("public_token", publicToken);
			data.set("_action", "linkAccount");

			submit(data, {
				method: 'post'
			});

		});

	}, [publicTokenOpt]);

	return (

		<div className="manage-accounts">

			<h1>Manage Accounts</h1>

			<div className="manage-accounts__link">
				{
					linkToken.length ?
						<Link linkToken={linkToken} setPublicToken={setPublicToken} /> :
						null
				}
			</div>

			<div className="manage-accounts__linked">
				<h2>Linked Institutions</h2>

				{/* <p>Not all linked accounts will be used, only investment and brokerage accounts</p> */}

				<br />

				<div className="manage-accounts__container">
					<LinkedInstitutions linkedInstitutions={linkedInstitutions} />
				</div>
			</div>


		</div>

	);

};

export default LinkAccount;
