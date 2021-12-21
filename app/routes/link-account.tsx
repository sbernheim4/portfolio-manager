import { Option, Some } from "excoptional";
import { CountryCode, ItemPublicTokenExchangeResponse, Products } from "plaid";
import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { MetaFunction, LoaderFunction, useLoaderData, ActionFunction, json, useSubmit, LinksFunction } from "remix";
import { createPlaidLinkToken, exchangePublicTokenForAccessToken } from "~/helpers/plaidUtils";
import { saveNewAccessToken } from "~/helpers/db";
import linkAccountStyles from '~/styles/link-account.css';

export const meta: MetaFunction = () => {
	return {
		title: "View and gain insights into your investments",
		description: "Track your investments, distributions, and more"
	};
};

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: linkAccountStyles }
	];
};

export const loader: LoaderFunction = async () => {

    // The logged in user's unique id
	// const { id: clientUserId } = await User.find(...);
	const clientUserId = "5a24ca6a4e95b836d37e37fe"

	const request = {
		user: {
			// This should correspond to a unique id for the current user.
			client_user_id: clientUserId,
		},
		client_name: 'Plaid Test App',
		products: [Products.Auth],
		language: 'en',
		webhook: 'https://webhook.example.com',
		country_codes: [CountryCode.Us],
	};

	const createTokenResponse = await createPlaidLinkToken(request);

	return {
        linkToken: createTokenResponse
	};

};

export const action: ActionFunction = async ({ request }) => {

	const body = await request.formData();
	const publicToken = body.get("public_token") as string;
	const { error } = await exchangePublicTokenForAccessToken(publicToken);

	if (error) {
		return json({ error: 'error making an access token' });
    }

	// Can also get item_id here
	const { access_token } = await exchangePublicTokenForAccessToken(publicToken) as ItemPublicTokenExchangeResponse

	const res = await saveNewAccessToken(access_token);

    return res;

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

	const loaderData = useLoaderData<{linkToken: string}>();
	const submit = useSubmit();
	const [publicTokenOpt, setPublicToken] = useState(Option.of<string>());

	const { linkToken } = loaderData;

	useEffect(() => {

		publicTokenOpt.map(async (publicToken) => {

			const data = new FormData();
			data.set("public_token", publicToken)

			submit(data, {
				method: 'post'
			});

		});

	}, [publicTokenOpt]);

	return (

		<div className="link-account">

			<h1>Link Your Account</h1>

			<p>Get started by linking your account. Click the button below to begin.</p>

			{
				linkToken.length ?
					<Link linkToken={linkToken} setPublicToken={setPublicToken} /> :
					null
			}


		</div>

	);

};

export default LinkAccount;
