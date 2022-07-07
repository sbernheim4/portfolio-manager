import { useEffect, useState } from "react";

export const useSearchableList = <T>(
	initialList: Array<T>,
	toFilterFn: (searchTerm: string) => (item: T) => boolean
): [string, React.Dispatch<React.SetStateAction<string>>, T[]] => {

	const [searchTerm, setSearchTerm] = useState("");
	const [displayItems, setDisplayItems] = useState(initialList);

	useEffect(() => {

		const getFilteredItems = () => {

			if (searchTerm === "") {
				return initialList;
			}

			const filterFunction = toFilterFn(searchTerm);
			const filteredValues = initialList.filter(filterFunction);

			return filteredValues;
		}

		setDisplayItems(getFilteredItems());


	}, [searchTerm]);

	return [searchTerm, setSearchTerm, displayItems];

};