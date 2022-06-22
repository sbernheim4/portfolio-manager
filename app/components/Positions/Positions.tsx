import { LinksFunction } from "@remix-run/node";
import positionsStyles from './styles/positions.css';
import {
	links as positionsTableStyles
} from './PositionsTable/PositionsTable';
import { links as stockPieChartStyles } from './StockPieChart/StockPieChart';

export const links: LinksFunction = () => {
	return [
		...stockPieChartStyles(),
		...positionsTableStyles(),
		{ rel: "stylesheet", href: positionsStyles }
	];
};

/**
 * Positions Container Component
 *
 * Can display Positions Table, Stock Pie Chart
 */
export const Positions = (
	props: { children: JSX.Element | JSX.Element[] }
) => {

	return (
		<div className="positions">
			{props.children}
		</div>
	);
};
