import { Institution } from "plaid";
import { LinksFunction } from "remix";
import linkAccountStyles from './styles/linked-account.css';

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: linkAccountStyles }
	];
};

export const LinkedInstitutions = (props: { linkedInstitutions: Institution[] }) => {

	const { linkedInstitutions } = props;

	return (
		<>
			{
				linkedInstitutions.map((acc) => <LinkedInstitution key={acc.item_id} linkedInstitution={acc} />)
			}
		</>
	);

};

const LinkedInstitution = (props: { linkedInstitution: Institution }) => {

	const institution = props.linkedInstitution;

	return (
		<div className="manage-accounts__container__modify">
			<p>{institution.name}</p>
			<button>Unlink Instituion</button>
		</div>
	);

};
