/*
	Viewer
	2020/10/26 新規作成
*/

const pinchTransform = require("./pinchTransform.js");

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
	canvas.style.cursor = "move";
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
			movingUpdate(pointers[0]);
			
		}else if(pointers.length == 2){
			setShift(e);
			movingUpdate(pointers[0],pointers[1]);
		}
	});
	
	//ポインター終了時の動作
	const pointerend = function(e){
		
		//座標変換を確定させる
		if(pointers.length == 1){
			pinchTransform.XY(ctx,pointers[0]);
			
		}else if(pointers.length == 2){
			pinchTransform.XY(ctx,pointers[0],pointers[1]);
			
			//ズーム制約
			const p0s = getXY(pointers[0].si,pointers[0].sj);
			const p1s = getXY(pointers[1].si,pointers[1].sj);
			const cx = (p0s.x + p1s.x) * 0.5;
			const cy = (p0s.y + p1s.y) * 0.5;
			clampScale({x:cx, y:cy});
		}
		
		clampXY();
		updateMatrix();
		update();
		
		pointers = [];
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
	//status表示(現在のctxにおける画面中心のXY座標とScale)
	//--------------------------------------------------
	
	const info = function(){
		const i = width * 0.5;
		const j = height * 0.5;
		const m = ctx.getTransform().invertSelf();
		const x = m.a * i + m.c * j + m.e;
		const y = m.b * i + m.d * j + m.f;
		const s = 1 / Math.sqrt(m.a * m.a + m.b * m.b);
		status("X=" + x.toFixed(8) + "<br>Y=" + y.toFixed(8) + "<br>Scale=" + s.toFixed(1) + "[px/1]");
	};
	
	//--------------------------------------------------
	//描画
	//--------------------------------------------------
	
	//画面中心の「＋」表示(IJ座標系で処理)
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
	
	//XY目盛り
	const drawGrid = function(xmin,xmax,dx,ymin,ymax,dy){
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
	
	//画面に表示された画像(移動中に表示させる)
	const image = new Image();
	
	//移動しながらの簡易表示
	const movingUpdate = function(p0,p1){
		
		//IJ座標系で処理
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		
		pinchTransform.IJ(ctx,p0,p1);
		
		ctx.drawImage(image,0,0,width,height,0,0,width,height);
		ctx.restore();
		
		drawCenter();
		
		//XY座標系で画面中心位置の状態を求めて表示
		ctx.save();
		pinchTransform.XY(ctx,p0,p1);
		info();
		ctx.restore();
	};
	
	//移動完了後の再表示
	const update = function(){
		//IJ座標系に直して全画面消去
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		ctx.restore();
		
		//XY座標で描画
		draw(ctx,width,height);
		
		//X,Y目盛り
		//ctx.lineWidth = 0.5 / getScale();
		//drawGrid(view.x.min,view.x.max,1,view.y.min,view.y.max,1);
		
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
		drawCenter();
	};
	
	update();
};