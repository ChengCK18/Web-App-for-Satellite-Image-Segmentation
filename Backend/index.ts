import express from 'express';
import * as ort from 'onnxruntime-node';
import * as Jimp from 'jimp';
import {createCanvas} from 'canvas'
require('dotenv').config()


const nj = require('numjs');
const fs = require('fs');
const cors = require('cors')

const webdriver = require ('selenium-webdriver')
const {until} = require('selenium-webdriver');
const By = webdriver.By;

const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

const app = express();
app.use(cors())

const loadImagefromPath = async(path: string, width: number = 256, height: number= 256) =>{
	var imageData = await Jimp.default.read(path).then((imageBuffer: Jimp) => {
		return imageBuffer;
	});
	
	return imageData;
}

const imageDataToTensor = async(image: Jimp, dims: number[])=>{
	// 1. Get buffer data from image 
	var imageBufferData = image.bitmap.data;
	const image_arr = new Array()
	// 2. Loop through the image buffer
	for (let i = 0; i < imageBufferData.length; i += 4) {
		image_arr.push(imageBufferData[i])
		image_arr.push(imageBufferData[i+1])
		image_arr.push(imageBufferData[i+2])

	}
	
	let nj_float32Data = nj.float32(image_arr)

	let minVal = nj_float32Data.min()
	let maxVal = nj_float32Data.max()


	for(let i=0;i<nj_float32Data.size;i++){
		nj_float32Data.set(i,(nj_float32Data.get(i) - minVal)/(maxVal-minVal))
	}

	// Create the tensor object 
	const inputTensor = new ort.Tensor("float32", nj_float32Data.tolist(), dims);
	//console.log(inputTensor)

	return inputTensor;
}

const getImageTensorFromPath = async(path: string, dims: number[] =  [1,256, 256,3]) =>{
	// 1. load the image  
	var image = await loadImagefromPath(path, dims[2], dims[3]);
	// 2. convert to tensor
	var imageTensor = imageDataToTensor(image, dims);
	// 3. return the tensor
	return imageTensor;
}

const runInference = async (session: ort.InferenceSession, preprocessedData: any): Promise<[any, number]> => {
	// Get start time to calculate inference time.
	const start = new Date();
	// create feeds with the input name from model export and the preprocessed data.
	const feeds: Record<string, ort.Tensor> = {};
	feeds[session.inputNames[0]] = preprocessedData;
	// Run the session inference.
	const outputData = await session.run(feeds);
	// Get the end time to calculate inference time.
	const end = new Date();

	// Convert to seconds.
	const inferenceTime = (end.getTime() - start.getTime())/1000;
	// Get output results with the output name from the model export.
	const output = outputData[session.outputNames[0]];
	//Get the softmax of the output data. The softmax transforms values to be between 0 and 1

	let output_formatted = output.data
	let array_of_npargmax = [] as any
	const num_class = 5
	
	// Based on the probabilities of each class output of the neural network,
	// Check every set of 5 values in the 1D array to get the index of the highest class probabilty
	for(let x =0 ; x < output_formatted.length; x += num_class){
		let temp_arr  = output_formatted.slice(x,x + num_class) as any
		var indexOfMaxValue = temp_arr.reduce((iMax:any, x:any, i:any, temp_arr:any) => x > temp_arr[iMax] ? i : iMax, 0);
		array_of_npargmax.push(indexOfMaxValue)
	}

	//console.log(array_of_npargmax.length)
	let reshaped_result = [] as any 
	// parse it from 256(width) x 256(height) x 5(number of class) to
	// 256(width) x 256(height) whereby each of the pixel is now the index of class with highest class probability for that pixel
	while(array_of_npargmax.length) {
		reshaped_result.push(array_of_npargmax.splice(0,256));
	}


	//console.log(reshaped_result.length,reshaped_result[0].length)
	
	return [reshaped_result, inferenceTime];
}

const ort_run_inference = async() => {
    try {

        const session = await ort.InferenceSession.create('model/unet_poland_ds_modelv1.onnx');

		var path = 'queried_image.png'
		// 1. Convert image to tensor
		const imageTensor = await getImageTensorFromPath(path);
		// 2. Run inference on model
		var [results, inferenceTime] =  await runInference(session, imageTensor);
		//console.log('Inference Time => ', inferenceTime)

		return results


    } catch (e) {
        console.error(`failed to inference ONNX model: ${e}.`);
    }
}

const scrape_infer_send = async(res:any,longitude_param:any,latitude_param:any) =>{
	
	var chromeCapabilities = webdriver.Capabilities.chrome();
	//setting chrome options to start the browser fully maximized
	var chromeOptions = {
		'args': [ '--start-maximized','--disable-web-security']
	};
	//const capabilities = {'chromeOptions': ['--disable-web-security','--disable-site-isolation-trials']}
	chromeCapabilities.set("goog:chromeOptions", chromeOptions);

	const driver = new webdriver.Builder().withCapabilities(chromeCapabilities).forBrowser('chrome').build();
	try{
		await driver.get(String(process.env.WEB_URL));
		
		let canvas = await driver.wait(until.elementLocated(By.xpath("//canvas[1]")),10000);
		let toggle_ref_label_div = await driver.wait(until.elementLocated(By.xpath("//div[@class='margin-left-half margin-right-quarter cursor-pointer']")),10000);
		let search_button = await driver.wait(until.elementLocated(By.xpath("//button[@class='esri-search__submit-button esri-widget--button']")),10000);
		let search_input_field = await driver.wait(until.elementLocated(By.xpath("//input[@class='esri-input esri-search__input']")),10000);
		let zoom_button = await driver.wait(until.elementLocated(By.xpath("//span[@class='esri-icon esri-icon-plus']")),10000);
		let reject_cookie = await driver.wait(until.elementLocated(By.id("onetrust-reject-all-handler")),10000);
		
		//To get the area of interest based on longitude and latitude
		setTimeout(() => { 
			search_input_field.sendKeys(`${latitude_param},${longitude_param}`).then(()=>{
				search_button.click().then(() =>{
					toggle_ref_label_div.click()
					reject_cookie.click()
					zoom_button.click()
					zoom_button.click()
					zoom_button.click().then(()=>{
						driver.executeScript("document.getElementsByClassName('esri-search esri-widget')[0].style.visibility='hidden';document.getElementsByClassName('reference-layer-toggle text-white')[0].style.visibility='hidden';document.getElementsByClassName('esri-zoom esri-widget')[0].style.visibility='hidden';document.getElementsByClassName('esri-component esri-attribution esri-widget')[0].style.visibility='hidden';document.getElementsByTagName('canvas')[0].setAttribute('style', 'width: 256px; height: 256px;');")
					})
				})
			});
		}, 5000)
		setTimeout(async () => { 
	
			driver.executeScript('document.getElementsByTagName("canvas")[0].setAttribute("style", "width: 256px !important; height: 256px !important;")')
			driver.executeScript('document.getElementsByTagName("canvas")[0].height = "256"')
			driver.executeScript('document.getElementsByTagName("canvas")[0].width = "256"')
		},16000)

		//Resize the map canvas and take a screenshot of the map canvas
		let scrapper_result_buffer = setTimeout(async () => { 
			try{
				let canvas2 = await driver.wait(until.elementLocated(By.xpath("//canvas[1]")),10000);
				let screenshot = await canvas2.takeScreenshot(false)
			
				fs.writeFileSync('queried_image.png', screenshot, 'base64')
				let prediction = await ort_run_inference()
				
				//console.log(prediction)
				console.log('Prediction complete :)')
				const WIDTH = 256;
				const HEIGHT = 256;
				const canvas = createCanvas(WIDTH, HEIGHT);
				const ctx = canvas.getContext("2d");
				//Background, buildings, greens, water , road
				const colours = ["#4A235A","#FFB900","#0FFF00","#008BFF","#FFF600"]
				let class_count = [0,0,0,0,0]

				//Create a 2d array to be displayed as image. Value assigned based on the class of that particular pixel
				for (let row=0;row<prediction.length;row++){
					for (let col=0;col<prediction[0].length;col++){
						ctx.fillStyle = colours[prediction[row][col]]
						class_count[prediction[row][col]] += 1
						ctx.fillRect(col, row, 1, 1);
					}
				}
		
				
				const buffer = canvas.toBuffer("image/png");

				//Pack and transmit data in JSON format
				//Convert buffer to base64 format to requester(frontend) to be parsed and to be displayed as image
				res.json({
					ori_img:screenshot.toString('base64'),
					pred_result:buffer.toString('base64'),
					class_count:class_count
				})
	
				res.end()
				
			}catch(error){
				console.log(error)
			}
			finally{
				//driver.quit();
			}
		},18000)

		

	}catch(error){
		console.log('Error found D: => ',error)
	}

}


app.get('/query_segment', (req, res) => {
	let longitude_param = req.query.longitude
	let latitude_param = req.query.latitude
	//console.log(longitude_param,latitude_param)
	scrape_infer_send(res,longitude_param,latitude_param)

});

app.listen(process.env.PORT, () => {
	console.log(`⚡️[server]: Server is running at Port ${process.env.PORT}`);
});

process.on('uncaughtException', function (err) {
    console.log("uncaughtException => ", err);
}); 