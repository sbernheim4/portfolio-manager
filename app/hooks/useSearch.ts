import { useEffect, useState } from "react";

export const useSearchHoldings = <T>(
	initialList: Array<T>,
	toFilterFn: (searchTerm: string) => (item: T) => boolean
): [string, React.Dispatch<React.SetStateAction<string>>, T[]] => {

	const [searchTerm, setSearchTerm] = useState("");
	const [displayItems, setDisplayItems] = useState(initialList);

	useEffect(() => {

		if (searchTerm === "") {
			setDisplayItems(initialList);
		}

		const filterFunction = toFilterFn(searchTerm);
		const filteredValues = initialList.filter(item => filterFunction(item));

		setDisplayItems(filteredValues);

	}, [searchTerm]);

	return [searchTerm, setSearchTerm, displayItems];

};

