/*
	mandelbrot
	2020/10/26 新規作成
*/

const Viewer = require("./Viewer.js");
const mandelbrot = require("./mandelbrot.js");

const vw = new Viewer(document.getElementById("viewer"),{
	x: {
		init: -0.5,
		min: -2,
		max: 1,
	},
	y: {
		init: 0.0,
		min: -1.5,
		max: 1.5,
	},
	scale: {
		init: 100,
		min: 100,
		max: 200000000,
	},
},function(ctx,width,height){
	
	mandelbrot(ctx,width,height);
	
},function(str){
	
	document.getElementById("status").innerHTML = str;
	
});
