/*
	pinchTransform
	2020/11/02 Viewerから切り離し
*/

const getXY = function(m,i,j){
	const x = m.a * i + m.c * j + m.e;
	const y = m.b * i + m.d * j + m.f;
	return {x,y};
};

//p0sがp0e、p1sがp1eに一致するように平行移動回転拡大(XY座標系で処理)
module.exports.XY = function(ctx,p0,p1){
	
	const m = ctx.getTransform().invertSelf()
	
	const p0s = getXY(m,p0.si,p0.sj);
	const p0e = getXY(m,p0.ei,p0.ej);
	
	//p1が未指定の場合は、平行移動のみ
	if(p1 == undefined){
		ctx.translate(p0e.x - p0s.x, p0e.y - p0s.y);
		return;
	}
	
	const p1s = getXY(m,p1.si,p1.sj);
	const p1e = getXY(m,p1.ei,p1.ej);

	ctx.translate(p0e.x, p0e.y);

	//p0を中心としてvsがveに一致するように回転拡大する座標変換
	//移動前のp0→p1ベクトルvs、移動後のp0→p1ベクトルve
	const vsi = p1s.x - p0s.x;
	const vsj = p1s.y - p0s.y;
	const vei = p1e.x - p0e.x;
	const vej = p1e.y - p0e.y;
	const k = 1 / (vsi * vsi + vsj * vsj);
	const ad = vei * vsi + vej * vsj;
	const bc = vej * vsi - vei * vsj;
	ctx.transform(ad * k, bc * k, -bc * k, ad * k, 0, 0);

	ctx.translate(-p0e.x, -p0e.y);

	//p0の位置を合わせる
	ctx.translate(p0e.x - p0s.x, p0e.y - p0s.y);
};


//p0sがp0e、p1sがp1eに一致するように平行移動回転拡大(IJ座標系で処理)
module.exports.IJ = function(ctx,p0,p1){
	
	//p1が未指定の場合は、平行移動のみ
	if(p1 == undefined){
		ctx.translate(p0.di,p0.dj);
		return;
	}
	
	ctx.translate(p0.ei,p0.ej);

	//p0を中心としてvsがveに一致するように回転拡大する座標変換
	//移動前のp0→p1ベクトルvs、移動後のp0→p1ベクトルve
	const vsi = p1.si - p0.si;
	const vsj = p1.sj - p0.sj;
	const vei = p1.ei - p0.ei;
	const vej = p1.ej - p0.ej;
	const k = 1 / (vsi * vsi + vsj * vsj);
	const ad = vei * vsi + vej * vsj;
	const bc = vej * vsi - vei * vsj;
	ctx.transform(ad * k, bc * k, -bc * k, ad * k, 0, 0);

	ctx.translate(-p0.ei,-p0.ej);

	//p0の位置を合わせる
	ctx.translate(p0.di,p0.dj);
};