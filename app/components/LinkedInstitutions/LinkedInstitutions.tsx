import { Institution } from "plaid";
import { LinksFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { LinkedInstitutionsResponse } from "~/routes/manage-accounts";
import linkAccountStyles from './styles/linked-account.css';

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: linkAccountStyles }
	];
};

export const LinkedInstitutions = (
	props: { linkedInstitutions: LinkedInstitutionsResponse }
) => {

	const { linkedInstitutions } = props;

	return (
		<>
			{
				linkedInstitutions.map((institution) => {
					return <LinkedInstitution
						key={institution.institution.institution_id}
						itemId={institution.itemId}
						linkedInstitution={institution.institution}
					/>
				})
			}
		</>
	);

};

const LinkedInstitution = (
	props: { itemId: string, linkedInstitution: Institution }
) => {

	const { linkedInstitution, itemId } = props;

	return (
		<div className="linked-institutions__container__modify">

			<p>{linkedInstitution.name}</p>

			<Form action="/manage-accounts" method="post">
				<input type="submit" value="Unlink Instituion" />
				<input type="hidden" name="_action" value="unlinkAccount" readOnly />
				<input type="hidden" value={itemId} name="itemId" readOnly />
			</Form>

		</div>
	);

};
