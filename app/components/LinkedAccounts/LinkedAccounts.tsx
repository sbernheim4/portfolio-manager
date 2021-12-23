import { AccountBase } from "plaid";
import { LinksFunction } from "remix";
import linkAccountStyles from './styles/linked-account.css';

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: linkAccountStyles }
	];
};

export const LinkedAccounts = (props: { linkedAccounts: AccountBase[] }) => {

	const { linkedAccounts } = props;

	return (
		<>
			{
				linkedAccounts.map((acc: AccountBase) => <LinkedAccount key={acc.account_id} linkedAccount={acc} />)
			}
		</>
	);

};

const LinkedAccount = (props: { linkedAccount: AccountBase }) => {

	const account = props.linkedAccount;

	return (
		<div className="manage-accounts__container__modify">
			<p>{account.name}</p>
			<button>Unlink Account</button>
		</div>
	);

};
