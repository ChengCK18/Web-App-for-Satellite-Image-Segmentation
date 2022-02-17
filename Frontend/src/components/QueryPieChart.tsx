import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


const QueryPieChart = (props:any) =>{
	let data = [
	{ name: 'Group A', value: 400 },
	{ name: 'Group B', value: 300 },
	{ name: 'Group C', value: 300 },
	{ name: 'Group D', value: 200 },
	];
	data = props.class_count


	const COLORS = ["#4A235A","#FFB900","#0FFF00","#008BFF","#FFF600"];

	const RADIAN = Math.PI / 180;
	const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }:any) => {
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);
		
		const text_style = {
			fill:"black",
			fontWeight:"bold"
		}
		
		if(parseFloat((percent * 100).toFixed(0))!== 0){
			return (
				<text x={x} y={y} style={text_style} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
				{`${(percent * 100).toFixed(0)}%`}
				
				
				</text>
			);
		}

	
	};


		return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart width={256} height={256}>
			<Pie
				data={data}
				cx="50%"
				cy="50%"
				labelLine={false}
				label={renderCustomizedLabel}
				outerRadius={80}
				fill="#8884d8"
				dataKey="value"
			>
				{data.map((entry, index) => (
				<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
				))}
			</Pie>
			</PieChart>
		</ResponsiveContainer>
		);
	
}

export default QueryPieChart