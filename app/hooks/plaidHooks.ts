import { useState, useEffect } from 'react';
import { Holding, ItemPublicTokenExchangeResponse } from 'plaid'
import { None, Option, Some } from 'excoptional';

export const useSandboxOrLinkAccessToken = (accessTokenDataFromLinkOpt: Option<ItemPublicTokenExchangeResponse>) => {

	const [accessToken, setAccessToken] = useState(Option.of<string>());

	useEffect(() => {

        // Load sandbox access token by default to avoid having to go through link
		const getAccessToken = async () => {

			try {

				const accessTokenRequest = await fetch('/api/sandbox/access-token', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});

				const accessTokenData = await accessTokenRequest.json();

				setAccessToken(Some(accessTokenData.accessToken as string));

			} catch (err) {
				setAccessToken(None());
			}

		}

		getAccessToken();

	}, []);

    // If we do go through link prefer using the access token returned from link
    useEffect(() => {

        if (accessTokenDataFromLinkOpt.isNone()) return

        accessTokenDataFromLinkOpt.map(accessTokenDataFromLink => {
            setAccessToken(Some(accessTokenDataFromLink.access_token));
        });

    }, [accessTokenDataFromLinkOpt])

	return accessToken;
}

export const getInvestments = async (
	accessToken: Option<string>,
    setInvestments: React.Dispatch<React.SetStateAction<Holding[]>>
) => {

	if (accessToken.isNone()) {
		return
	}

	try {

		const investmentsRequest = await fetch('/api/investments', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-plaid-access-token': accessToken.getOrElse('')
			}
		});

		const { investments } = await investmentsRequest.json();

		setInvestments(investments);

	} catch (err) {
		setInvestments([]);
	}

}

export const usePlaidInvestments = (accessToken: Option<string>) => {

	const [investments, setInvestments] = useState<Holding[]>([]);

	useEffect(() => {
		getInvestments(accessToken, setInvestments);
	}, [accessToken]);

	return { investments, setInvestments };

}

