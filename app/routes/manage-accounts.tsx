import { Option, Some } from "excoptional";
import { CountryCode, Institution, Products } from "plaid";
import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { MetaFunction, LoaderFunction, useLoaderData, ActionFunction, json, useSubmit, LinksFunction } from "remix";
import { createPlaidLinkToken, exchangePublicTokenForAccessToken, getPlaidLinkedInstitutions, getPlaidLinkedAccounts, unlinkPlaidItem } from "~/helpers/plaidUtils";
import { saveNewAccessToken } from "~/helpers/db";
import { LinkedInstitutions, links as linkedAccountStyles } from "~/components/LinkedAccounts/LinkedAccounts";

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

type LoaderResponse = {
	linkedInstitutions: LinkedInstitutionsResponse;
	linkToken: string;
};

export const loader: LoaderFunction<LoaderResponse> = async () => {

	const linkedInstitutions = await getPlaidLinkedInstitutions();

    // The logged in user's unique id
	// const { id: clientUserId } = await User.find(...);
	const clientUserId = "5a24ca6a4e95b836d37e37fe"

	const request = {
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

	const createTokenResponse = await createPlaidLinkToken(request);

	return {
		linkedInstitutions,
        linkToken: createTokenResponse
	};

};

export const action: ActionFunction = async ({ request }) => {

	const body = await request.formData();
	const action = body.get("_action");

	switch(action) {
		case "linkAccount":
			const publicToken = body.get("public_token") as string;
			const { error } = await exchangePublicTokenForAccessToken(publicToken);

			if (error) {
				return json({
					error: 'error making an access token'
				});
			}

			// Can also get item_id here
			const { access_token, item_id } = await exchangePublicTokenForAccessToken(publicToken);

			await saveNewAccessToken(access_token, item_id);

			return null;
		case "unlinkAccount":
			const itemId = body.get("itemId") as string;
			unlinkPlaidItem(itemId);
			return null;
		default:
			console.log("whoops, uncaught action type");
			break;
	}
};

const Link = (props: { linkToken: string, setPublicToken: React.Dispatch<React.SetStateAction<Option<string>>>}) => {

	const onSuccess = useCallback(async (public_token, _metadata) => {

		props.setPublicToken(Some(public_token));

	}, []);

	const config: Parameters<typeof usePlaidLink>[0] = {
		token: props.linkToken,
		onSuccess,
		env: 'sandbox'
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

	const loaderData = useLoaderData<LoaderResponse>();
	const submit = useSubmit();
	const [publicTokenOpt, setPublicToken] = useState(Option.of<string>());

	const { linkToken, linkedInstitutions } = loaderData;

	useEffect(() => {

		publicTokenOpt.map(async (publicToken) => {

			const data = new FormData();
			data.set("public_token", publicToken);
			data.set("_name", "linkAccount");

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
