import { Option, Some } from "excoptional";
import { CountryCode, Institution, Products } from "plaid";
import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { ActionFunction, LinksFunction, LoaderFunction, MetaFunction, json, useLoaderData, useSubmit, redirect } from "remix";
import { createPlaidLinkToken, exchangePublicTokenForAccessToken, getPlaidLinkedInstitutions, unlinkPlaidItem } from "~/helpers/plaidUtils";
import { saveNewAccessToken } from "~/helpers/db";
import { LinkedInstitutions, links as linkedAccountStyles } from "~/components/LinkedAccounts/LinkedAccounts";
import { isLoggedOut } from "./login";
import { getUserNameFromSession } from "~/helpers/session";

export const meta: MetaFunction = () => {
	return {
		title: "View and gain insights into your investments",
		description: "Track your investments, distributions, and more"
	};
};

export const links: LinksFunction = () => {
	return [
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
	if (await isLoggedOut(request)) {
		return redirect("/login");
	}

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
		products: [Products.Auth],
		language: 'en',
		webhook: 'https://webhook.example.com',
		country_codes: [CountryCode.Us],
	};

	const createTokenResponse = await createPlaidLinkToken(plaidRequest);

	return json(
		{
			linkedInstitutions,
			linkToken: createTokenResponse
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
			const { error } = await exchangePublicTokenForAccessToken(publicToken);

			if (error) {

				console.log('error making an access token');

				return json({
					error: 'error making an access token'
				});

			}

			const { access_token, item_id } = await exchangePublicTokenForAccessToken(publicToken);

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

	const onSuccess = useCallback(async (public_token, _metadata) => {

		props.setPublicToken(Some(public_token));

	}, []);

	const config: Parameters<typeof usePlaidLink>[0] = {
		token: props.linkToken,
		onSuccess,
		env: 'development'
	};

	const { open, ready } = usePlaidLink(config);

	return (
		<>
			<button onClick={() => open()} disabled={!ready}>
				Link Account
			</button>
		</>
	);

};


const LinkAccount = () => {

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

			<h1>Link A New Account</h1>

			{
				linkToken.length ?
					<Link linkToken={linkToken} setPublicToken={setPublicToken} /> :
					null
			}

			<h1>Linked Accounts</h1>
			<p>Not all linked accounts will be used, only investment and brokerage accounts</p>
			<br />
			<div className="manage-accounts__container">
				<LinkedInstitutions linkedInstitutions={linkedInstitutions} />
			</div>

		</div>

	);

};

export default LinkAccount;
