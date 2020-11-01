/*
	Viewer
	2020/10/26 新規作成
*/

//XY目盛り
const drawGrid = function(ctx,xmin,xmax,dx,ymin,ymax,dy){
	for(let x = xmin; x <= xmax; x += dx){
		ctx.beginPath();
		ctx.moveTo(x,ymin);
		ctx.lineTo(x,ymax);
		ctx.closePath();
		ctx.stroke();
	}
	
	for(let y = ymin; y <= ymax; y += dy){
		ctx.beginPath();
		ctx.moveTo(xmin,y);
		ctx.lineTo(xmax,y);
		ctx.closePath();
		ctx.stroke();
	}
};

//表示画面
module.exports = function(element,view,draw,status){
	
	if(!("min" in view.x)) view.x.min = undefined;
	if(!("max" in view.x)) view.x.max = undefined;
	if(!("min" in view.y)) view.y.min = undefined;
	if(!("max" in view.y)) view.y.max = undefined;
	
	const width = element.clientWidth;
	const height = element.clientHeight;
	
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.style.cursor = "crosshair";
	canvas.style.touchAction = "none";
	element.appendChild(canvas);
	
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "rgba(255,255,255,1.0)";
	ctx.strokeStyle = "rgba(255,255,255,1.0)";
	
	//原点をcanvas中心に移動
	ctx.translate(width * 0.5, height * 0.5);
	
	//縮尺[px/1]、Y軸を上下逆転
	ctx.scale(view.scale.init, -view.scale.init);
	
	//画面中心の座標(X,Y)を設定
	ctx.translate(-view.x.init, -view.y.init);
	
	//--------------------------------------------------
	//座標変換
	//--------------------------------------------------
	
	let mtXY2IJ = ctx.getTransform();
	let mtIJ2XY = ctx.getTransform().invertSelf();
	
	const updateMatrix = function(){
		mtXY2IJ = ctx.getTransform();
		mtIJ2XY = ctx.getTransform().invertSelf();
	};
	
	const getXY = function(i,j){
		const x = mtIJ2XY.a * i + mtIJ2XY.c * j + mtIJ2XY.e;
		const y = mtIJ2XY.b * i + mtIJ2XY.d * j + mtIJ2XY.f;
		return {x,y};
	};
	
	const getIJ = function(x,y){
		const i = mtXY2IJ.a * x + mtXY2IJ.c * y + mtXY2IJ.e;
		const j = mtXY2IJ.b * x + mtXY2IJ.d * y + mtXY2IJ.f;
		return {i,j};
	};
	
	const getScale = function(){
		return Math.sqrt(mtXY2IJ.a * mtXY2IJ.a + mtXY2IJ.b * mtXY2IJ.b);
	};
	
	//--------------------------------------------------
	//移動拡大制約
	//--------------------------------------------------
	
	//画面中心がxyの範囲内に収まるように移動
	const clampXY = function(){
		updateMatrix();
		const p = getXY(width * 0.5,height * 0.5);
		
		let x = p.x;
		let y = p.y;
		
		if(view.x.min != undefined && x < view.x.min) x = view.x.min;
		if(view.x.max != undefined && x > view.x.max) x = view.x.max;
		if(view.y.min != undefined && y < view.y.min) y = view.y.min;
		if(view.y.max != undefined && y > view.y.max) y = view.y.max;
		
		ctx.translate(p.x - x, p.y - y);
	};
	
	//p: 拡大中心位置(XY座標)
	const clampScale = function(p){
		updateMatrix();
		
		let k = 1;
		
		if(getScale() > view.scale.max){
			k = view.scale.max / getScale();
		};
			
		if(getScale() < view.scale.min){
			k = view.scale.min / getScale();
		};
		
		ctx.translate(p.x, p.y);
		ctx.scale(k,k);
		ctx.translate(-p.x, -p.y);
	};
	
	//--------------------------------------------------
	//ポインターイベント
	//--------------------------------------------------
	
	//動作中のポインター
	let mouse = null;	//クリックしていない状態のマウス位置（e.pointerId=1となるが、pointersには含めない)
	let pointers = [];	//クリックまたはタップされたポインターの位置
	
	canvas.addEventListener("pointerdown",function(e){
		canvas.style.cursor = "move";
		
		pointers.push({
			id: e.pointerId,
			si: e.offsetX,
			sj: e.offsetY,
		});
	});
	
	//該当するポインターの状態を更新する
	const setShift = function(e){
		const pt = pointers.find(function(p){
			return p.id == e.pointerId;
		});
		
		//最新位置
		pt.ei = e.offsetX;
		pt.ej = e.offsetY;
		
		//移動量
		pt.di = e.offsetX - pt.si;
		pt.dj = e.offsetY - pt.sj;
	};
	
	canvas.addEventListener("pointermove",function(e){
		
		if(pointers.length == 0){
			mouse = {
				i: e.offsetX,
				j: e.offsetY,
			};
			
		}else if(pointers.length == 1){
			setShift(e);
			movingUpdate(pointers[0].di,pointers[0].dj);
			
		}else if(pointers.length == 2){
			setShift(e);
			movingUpdate2(pointers[0],pointers[1]);
		}
	});
	
	//座標変換を確定させる
	const fixTransform = function(){
		
		if(pointers.length == 1){
			//p0がp1に一致するように平行移動
			const p0 = getXY(pointers[0].si,pointers[0].sj);
			const p1 = getXY(pointers[0].ei,pointers[0].ej);
			ctx.translate(p1.x - p0.x,p1.y - p0.y);
			
		}else if(pointers.length == 2){
			//p0sがp0e、p1sがp1eに一致するように平行移動回転拡大
			const p0s = getXY(pointers[0].si,pointers[0].sj);
			const p0e = getXY(pointers[0].ei,pointers[0].ej);
			const p1s = getXY(pointers[1].si,pointers[1].sj);
			const p1e = getXY(pointers[1].ei,pointers[1].ej);
			
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
			
			//ズーム制約
			const cx = (p0s.x + p1s.x) * 0.5;
			const cy = (p0s.y + p1s.y) * 0.5;
			clampScale({x:cx, y:cy});
		}
		
		clampXY();
		updateMatrix();
	}
	
	//ポインター終了時の動作
	const pointerend = function(e){
		fixTransform();
		update();
		
		pointers = [];
		
		canvas.style.cursor = "crosshair";
	};
	
	window.addEventListener("pointerup",pointerend);
	window.addEventListener("pointercancel",pointerend);
	
	//--------------------------------------------------
	//マウスホイールイベント(PC専用)
	//--------------------------------------------------
	
	canvas.addEventListener("wheel",function(e){
		
		//マウスの位置pを中心にk倍する
		const p = getXY(e.offsetX,e.offsetY);
		const k = e.deltaY < 0 ? 1.4 : 1 / 1.4;
		
		ctx.translate(p.x,p.y);
		ctx.scale(k,k);
		ctx.translate(-p.x,-p.y);
		
		clampScale(p);
		clampXY();
		updateMatrix();
		update();
	});
	
	//--------------------------------------------------
	//描画
	//--------------------------------------------------
	
	//画面に表示された画像(移動中に表示させる)
	const image = new Image();
	
	const drawCenter = function(){
		ctx.save();
		ctx.resetTransform();
		ctx.strokeStyle = "rgba(255,255,255,1.0)";
		
		const ci = width * 0.5;
		const cj = height * 0.5;
		
		ctx.lineWidth = 1.0;
		
		ctx.beginPath();
		ctx.moveTo(ci-10,cj);
		ctx.lineTo(ci+10,cj);
		ctx.closePath();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(ci,cj-10);
		ctx.lineTo(ci,cj+10);
		ctx.closePath();
		ctx.stroke();
		
		ctx.restore();
	};
	
	//status表示
	const info = function(){
		drawCenter();
		const p = getXY(width * 0.5,height * 0.5);
		const scale = getScale();

		status("X=" + p.x.toFixed(8) + "<br>Y=" + p.y.toFixed(8) + "<br>Scale=" + scale.toFixed(1) + "[px/1]");
	};
	
	//平行移動用(簡略化版)
	const movingUpdate = function(di,dj){
		
		//IJ座標系に直して処理
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		
		ctx.translate(di, dj);
		ctx.drawImage(image,0,0,width,height,0,0,width,height);
		
		ctx.restore();
		
		drawCenter();
	};
	
	//ピンチインアウト版
	const movingUpdate2 = function(p0,p1){
		
		//IJ座標系に直して処理
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		
		//p0sがp0e、p1sがp1eに一致するように平行移動回転拡大
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
		
		ctx.drawImage(image,0,0,width,height,0,0,width,height);
		ctx.restore();
		
		drawCenter();
	};
	
	const update = function(){
		//IJ座標系に直して全画面消去
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		ctx.restore();
		
		//XY座標で描画
		draw(ctx,width,height);
		
		//X,Y目盛り
//		ctx.lineWidth = 0.5 / getScale();
//		drawGrid(ctx,view.x.min,view.x.max,1,view.y.min,view.y.max,1);
		
		//IJ座標系に直して描画(文字サイズをピクセル単位で指定するため)
		/*
		let mt = ctx.getTransform();
		const getIJ = function(x,y){
			const i = mt.a * x + mt.c * y + mt.e;
			const j = mt.b * x + mt.d * y + mt.f;
			return {i,j};
		};
		
		ctx.save();
		ctx.resetTransform();
		
		const p = getIJ(0,0);
		ctx.fillText("0",p.i,p.j);
		
		const p1 = getIJ(1,0);
		ctx.fillText("1",p1.i,p1.j);
		
		ctx.restore();
		*/
		
		//移動中表示用の画像保存
		image.src = canvas.toDataURL();
		
		//情報表示
		info();
	};
	
	update();
};