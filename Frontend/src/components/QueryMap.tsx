import React, {useState,useCallback} from 'react'
import { GoogleMap, useJsApiLoader,Marker,Polygon} from '@react-google-maps/api';
import QueryOptions from './QueryOptions';



const containerStyle = {
	width: '100%',
	height: '100%',
	backgroundColor:'purple',
	textAlign:'center' as const
}; 


const QueryMap = (): JSX.Element =>{
	const [latitude,setLatitude] = useState(50.286756)
	const [longitude,setLongitude] = useState(21.443653)

	const { isLoaded } = useJsApiLoader({
		id: 'google-map-script',
		googleMapsApiKey: String(process.env.REACT_APP_GOOGLE_MAP_API_KEY)
	})
	

	//const [map, setMap] = useState(null)
	let latitude_copy = latitude
	let longitude_copy = longitude
	const map_rect_size = 0.0015
	let path =[
		{ lat: latitude_copy - map_rect_size , lng: longitude_copy - map_rect_size - 0.0025},
		{ lat: latitude_copy + map_rect_size, lng: longitude_copy - map_rect_size  - 0.0025},
		{ lat: latitude_copy + map_rect_size, lng: longitude_copy + map_rect_size + 0.0025},
		{ lat: latitude_copy - map_rect_size, lng: longitude_copy + map_rect_size + 0.0025}
	];
	/*
	const onLoad = useCallback((map) => {
		const bounds = new window.google.maps.LatLngBounds();
		map.fitBounds(bounds);
			setMap(map)
			map.panTo({lat:latitude,lng:longitude})
	}, [])

	const onUnmount = useCallback((map) => {
		setMap(null)
	}, [])
	*/
	const onClick = (event:any) =>{
		setLatitude(event.latLng.lat())
		setLongitude(event.latLng.lng())
		
	}
	return isLoaded ? (
		<div className='flex-col  m-2 flex w-full  grow'>
			<div className = "h-2/4 flex w-full ">
			<GoogleMap
			mapContainerStyle={containerStyle}
			center={{lat:latitude,lng:longitude}}
			zoom={10}
			//onLoad={onLoad}
			//onUnmount={onUnmount}
			onClick={onClick}
			options={{
				// these following 7 options turn certain controls off see link below
				streetViewControl: false,
				scaleControl: false,
				
				panControl: false,
				mapTypeId:"satellite",
				zoomControl: false,
				rotateControl: false,
				fullscreenControl: false
			}
			}
			>
			<Marker position={{ lat:latitude, lng: longitude }} />
			<Polygon
				path={path} options={{ fillColor:"#9FFF54" , clickable:false}}
			/>
			
			</GoogleMap>
			</div>
			<QueryOptions latitude={latitude} 
			setLatitude={setLatitude}
			longitude={longitude}
			setLongitude={setLongitude}/>
		</div>

	) : <div> Map Cannot be loaded</div>


}

export default QueryMap

