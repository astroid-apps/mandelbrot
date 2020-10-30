/*
	マンデルブロ集合
	2020/10/25 新規作成
*/

const md = function(x,y){
	let xn = 0;
	let yn = 0;
	
	for(let i=0; i<256; i++){
		const xn1 = xn * xn - yn * yn + x;
		const yn1 = 2 * xn * yn + y;
		xn = xn1;
		yn = yn1;
		
		if(xn * xn + yn * yn > 4) return 256 - i;
	}
	
	return 0;
};


module.exports = function(ctx,width,height){
	//IJ座標からXY座標への変換行列
	const m = ctx.getTransform().invertSelf();
	
	const data = ctx.getImageData(0, 0, width, height);

	for(let j=0; j<height; j++){
		for(let i=0; i<width; i++){
			const index = (i + j * width) * 4;
			
			const x = m.a * i + m.c * j + m.e;
			const y = m.b * i + m.d * j + m.f;
			const c = md(x,y);
			
			data.data[index] = c; // R
			data.data[index+1] = c; // G
			data.data[index+2] = c; // B
			data.data[index+3] = 255; // A
		}
	}
	
	ctx.putImageData(data, 0, 0);
};
