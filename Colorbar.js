/*
	Colorbar
	2023/12/01 ESモジュールに変更
	2020/11/01 新規作成
*/

const HEX2RGB = function(c){
	const r = (c & 0xff0000) >> 16;
	const g = (c & 0x00ff00) >> 8;
	const b = c & 0x0000ff;
	return {r,g,b};
};

export default function(min,max,colors){
	
	const n = colors.length;
	const dx = (max - min) / (n - 1);
	
	const interpolate = function(x,x0,y0,x1,y1){
		return (x - x0) * (y1 - y0) / (x1 - x0) + y0;
	}
	
	this.get = function(x){
		if(x <= min) return HEX2RGB(colors[0]);
		if(x >= max) return HEX2RGB(colors[n-1]);
		
		const i = Math.floor((x - min) / dx);
		const x0 = min + i * dx;
		const c0 = HEX2RGB(colors[i]);
		const c1 = HEX2RGB(colors[i+1]);
		
		const r = interpolate(x,x0,c0.r,x0 + dx,c1.r);
		const g = interpolate(x,x0,c0.g,x0 + dx,c1.g);
		const b = interpolate(x,x0,c0.b,x0 + dx,c1.b);
		return {r,g,b};
	};
}