/*
	mandelbrot
	2023/12/01 ESモジュールに変更
	2020/10/26 新規作成
*/

import Viewer from "./Viewer.js";
import mandelbrot from "./mandelbrot.js";

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
