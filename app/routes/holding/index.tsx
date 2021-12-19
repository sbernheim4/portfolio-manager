import { AccountBase } from "plaid";
import { json, LinksFunction, LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { Positions, links as positionStyles } from "~/components/Positions";
import { isFilled } from "~/helpers/isFilled";
import { getInvestmentHoldings, getPlaidAccountBalances } from "~/helpers/plaidUtils";
import { InvestmentResponse } from '../../types/index';
import holdingStyles from "./../../styles/holding.css"

export const meta: MetaFunction = () => {
	return {
		title: "Your Investments",
		description: "View your investments across your entire portfolio"
	};
};

export const links: LinksFunction = () => {
	return [
        ...positionStyles(),
		{ rel: "stylesheet", href: holdingStyles }
	];
};

export const loader: LoaderFunction = async () => {

	const promises: [
		Promise<InvestmentResponse>,
		Promise<Array<AccountBase>>
	] = [
		getInvestmentHoldings(),
		getPlaidAccountBalances()
	];

	const results = await Promise.allSettled(promises);

	// @ts-ignore
	const resolvedPromises: [
		InvestmentResponse,
		AccountBase[]
	] = results
		// @ts-ignore
		.filter(isFilled)
		// @ts-ignore
		.map(x => x.value);

	const [investmentData, balances] = resolvedPromises;
	const { holdings, securities } = investmentData;

	return json(
		{ balances, holdings, securities },
		{ headers: { "Cache-Control": "max-age=43200" } }
	);

};

const Holdings = () => {
    const investmentData = useLoaderData<InvestmentResponse>();
	const { holdings, securities } = investmentData;

	return (
		<>
			<Positions securities={securities} holdings={holdings} />
		</>
	);

};

export default Holdings;
