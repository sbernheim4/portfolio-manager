import { Holding } from "plaid";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { LinksFunction } from "remix";
import { dollarFormatter } from "~/helpers/formatters";
import stockPieChartStyles from "./stockPieChart.css";

export const COLORS = [
	'#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
	'#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
	'#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
	'#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
	'#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
	'#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
	'#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
	'#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
	'#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
	'#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
];

export const links: LinksFunction = () => {
	return [
		{ rel: "stylesheet", href: stockPieChartStyles }
	];
};

export const StockPieChart = (props: {
	securityIdToTickerSymbol: Record<string, string | null>;
	holdings: Holding[];
}) => {

	const { securityIdToTickerSymbol, holdings } = props;

	const data = holdings.map(holding => {
		const name = securityIdToTickerSymbol && securityIdToTickerSymbol[holding.security_id] ?
			securityIdToTickerSymbol[holding.security_id] :
			holding.security_id;

		return {
			name,
			value: holding.institution_value,
			securityId: holding.security_id
		};
	});

	return (
		<div className="stock-pie-chart">
			<h1>Investments by Size</h1>

			<ResponsiveContainer width={500} height={500}>
				<PieChart>

					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="55%"
						innerRadius="40%"
						fill="#8884d8"
						label={PieLabel}
					>
						{data.map((_, i) => <Cell key={_.securityId} fill={COLORS[i % COLORS.length]}/>)}
					</Pie>

					<Tooltip formatter={foo} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
};

const PieLabel = (props: { name: string }) => {

	const { name } = props;

	return name;
};

const foo = (dollarAmount: number) => {
	return dollarFormatter.format(dollarAmount);
};
