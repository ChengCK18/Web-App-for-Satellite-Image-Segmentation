import React, { useState } from 'react'
import QueryPieChart from './QueryPieChart'
import axios from 'axios'
const baseUrl = 'http://localhost:3001/query_segment'

type QueryMenuProps = {
	latitude:number,
	setLatitude:(latitude:number) => void,
	longitude:number,
	setLongitude:(longitude:number) => void,
}

const QueryOptions = (props:QueryMenuProps):JSX.Element =>{
	const [queried_image_buffer,setQueried_image_buffer] = useState("")
	const [prediction_buffer,setPrediction_buffer] = useState("")
	const [class_count,setClass_count] = useState([
		{ name: 'Background', value: 0 },
		{ name: 'Buildings', value: 0 },
		{ name: 'Greens', value: 0 },
		{ name: 'Water', value: 0 },
		{ name: 'Road', value: 0 },
	])
	const [pending_status,setPending_status] = useState(false)
	let button_content = null
	

	
	const onSubmit = (event:any) =>{
		setPending_status(true)
		event.preventDefault()
		
		const request = axios.get(baseUrl,{
			params:{
				longitude:props.longitude,
				latitude:props.latitude
			}
		})
		request.then( response => {
			
			setQueried_image_buffer("data:image/jpeg;base64,"+ response.data.ori_img)
			setPrediction_buffer("data:image/jpeg;base64," + response.data.pred_result)
			setClass_count(
				[
					{ name: 'Background', value: response.data.class_count[0] },
					{ name: 'Buildings', value: response.data.class_count[1] },
					{ name: 'Greens', value: response.data.class_count[2] },
					{ name: 'Water', value: response.data.class_count[3] },
					{ name: 'Road', value: response.data.class_count[4] },
				]
			)
			setPending_status(false)
		})


		
	}
	if (pending_status === true){
		button_content = 
		<>
			<button className='flex m-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg' type="submit" disabled={true}>
				<div className="animate-spin spinner-border inline-block mr-1 w-8 h-8 border-4 rounded-full" >
					<div className=" bg-green-600 w-6 h-6 "/>
				</div>
				<div>
					Querying...
				</div>
			</button>
		</>
		
	}else{
		button_content = 
		<button className='flex m-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg' type="submit">
			<div>
				Query
			</div>
		</button>
	}

	return <div className='flex w-full h-2/4'>

		<div className='bg-sky-700 rounded-md flex flex-wrap w-1/4 my-2 overflow-auto'>
			<form  className='flex-1 m-auto text-center' onSubmit={onSubmit}>
				<div className='flex flex-col flex-wrap '>
					<div className='text-[1em] '><h5 className='font-bold'>Longitude</h5>{props.longitude}</div>
					<div  className='text-[1em]'><h5 className='font-bold'>Latitude</h5>{props.latitude}</div>
				</div>
				<br/>

				{button_content}
  			
			</form>
		</div>

		<div className=' bg-sky-700 rounded-md flex flex-wrap items-center justify-center w-3/4 ml-2 mt-2 mb-2 pt-3.5 overflow-auto'>
			<div>
				<h1 className='text-center font-bold'>Queried Image</h1>
				<div className='bg-cyan-600 mr-4 mb-4 w-[256px] h-[256px]'>
					{prediction_buffer==="" ?<></>:<img  src={queried_image_buffer} alt="Pending Query..." ></img>}
					
				</div>
			</div>

			<div>
				<h1 className='text-center font-bold'>Model Segmented Image</h1>
				<div className='bg-cyan-600 mr-4 mb-4 w-[256px] h-[256px]'>
					{prediction_buffer==="" ?<></>: <img src={prediction_buffer} alt="Pending Query..." ></img>}
					
				</div>
			</div>
			<div>
				<h1 className='text-center font-bold'>Result</h1>
				<div className='bg-cyan-600 rounded-full mr-4 mb-4 w-[256px] h-[256px]'>
					{prediction_buffer==="" ?<></>: <QueryPieChart class_count={class_count}/>}
					
				</div>
			</div>
			<div>
				<h1 className='text-center font-bold'>Legend</h1>
				<div className='bg-cyan-600 rounded-lg mr-4 p-2.5 mb-4 w-[256px] h-[256px] '>
					<div className='font-bold text-white-700 rounded-full bg-[#4A235A] flex items-center justify-center font-mono mb-4  '>Background</div>
					<div className='font-bold text-gray-700 rounded-full bg-[#FFB900] flex items-center justify-center font-mono mb-4 '>Buildings</div>
					<div className='font-bold text-gray-700 rounded-full bg-[#0FFF00] flex items-center justify-center font-mono mb-4 '>Green Pasture</div>
					<div className='font-bold text-gray-700 rounded-full bg-[#008BFF] flex items-center justify-center font-mono mb-4 '>Water</div>
					<div className='font-bold text-gray-700 rounded-full bg-[#FFF600] flex items-center justify-center font-mono mb-4 '>Road</div>
				</div>
			</div>

		</div>

	</div>
}

export default QueryOptions