/*************************************************
* Shape Experiment
* MIT License
* Copyright 2013, Max Irwin
* https://github.com/binarymax/shape
*************************************************/

"use strict";

// ==============================================================
var shape = (function() { 
	
	
	var _gap   = 20;
	var _keyid = 1;
	var _color = "#333333";
	var _shapes = [];
	
	//------------------------------------------------------------------	
	//Random number helpers
	var rand1 = function(max){ return Math.floor(Math.random()*max); };
	var rand2 = function(min,max){ return Math.floor(Math.random() * (max - min + 1)) + min; };

	//------------------------------------------------------------------
	//DOM initializers
	var canvas = function(name,width,height,scale) {
		var canvas = document.createElement("canvas");
		scale = scale || 1; 
		canvas.width  = width;
		canvas.height = height;
		canvas.style.width  = width * scale + 'px';
		canvas.style.height = height * scale + 'px';
		canvas.style.backgroundColor = "#ffffff";
		canvas.style.display = "none";
		canvas.setAttribute("id","canvas"+name);
		canvas.setAttribute("name",name);
		canvas.setAttribute("data-scale",1);
		document.getElementById("shapes").appendChild(canvas);
		return canvas;
	};

	var context = function(cvs) {
		var ctx    = cvs.getContext("2d");
		var scale  = parseInt(cvs.getAttribute("data-scale",scale)) || 1;
		ctx.width  = cvs.width;
		ctx.height = cvs.height;
		ctx.scaled = scale;
		ctx.scale(scale,scale);

		//Clear method
		ctx.clear = function() { ctx.clearRect(0, 0, ctx.width, ctx.height); return ctx; };
		return ctx;
	};

	var button = function(key,name,icon){
		var div  = document.createElement("div");
		var btn = document.createElement("input");
		btn.style.backgroundImage = "url("+icon+")";
		btn.style.backgroundPosition = "22px 3px";
		btn.setAttribute("type","button");
		btn.setAttribute("id","button"+name);
		btn.setAttribute("name",name);
		btn.className = "button";
		div.appendChild(btn);
		document.getElementById("buttons").appendChild(div);
		return btn;
	};

	//------------------------------------------------------------------
	//Shape class
	var Shape = function(name,draw){
		var self     = this;
		self.name    = name;
		self.width   = 100;
		self.height  = 100;
		self.scale	 = 4;
		self.key     = _keyid;
		self.canvas  = canvas(name, self.width, self.height, self.scale);
		self.context = context(self.canvas);
		self.draw    = draw;
		self.pixels  = [];
		self.makebutton().redraw();
		self.total = self.pixels.length;
		_shapes[name] = self;
		_keyid++;
	};
	Shape.prototype.eachPixel = function(callback) {
		var self = this;
		var image  = self.context.getImageData(0,0,self.width,self.height);
		var data   = image.data;
		var length = data.length;
		for(var y=0;y<self.height;y++) {
			for(var x=0;x<self.width;x++) {
				var i = (x+y*self.width)*4;
				callback(x,y,data[i],data[i+1],data[i+2],data[i+3]);
			}
		}
		return image;
	};
	Shape.prototype.cachePixels = function(){
		var self = this;
		self.pixels = [];
		self.eachPixel(function(x,y,r,g,b,a) {
			if (r<255&&g<255&&b<255 && r>0&&g>0&&b>0&&a>0.0) self.pixels.push({x:x,y:y});
		});
	};
	Shape.prototype.randPixel = function(){
		var self = this;
		var i = rand1(self.pixels.length);
		var p = self.pixels[i];
		self.pixels.splice(i,1);
		return p;
	};
	Shape.prototype.putPixel = function(r,g,b,a){
		var self = this;
		var xy = self.randPixel();
		var i = (xy.x+xy.y*self.width)*4;
		var image = self.image; 
		image.data[i+0]=r;
		image.data[i+1]=g;
		image.data[i+2]=b;
		image.data[i+3]=a||255;
		self.context.putImageData(image,0,0);
	};

	Shape.prototype.makebutton = function(){
		var self = this;
		self.context.scale(0.5,0.5);
		self.draw.call(self,_color);
		self.icon = self.canvas.toDataURL();
		self.context.scale(2,2);
		self.context.clear();
		self.button = button(self.key,self.name,self.icon);
		return self;
	};

	Shape.prototype.redraw = function(){
		var self = this;
		self.draw.call(self,_color);
		self.cachePixels();
		self.context.clear();
		self.image = self.context.getImageData(0,0,self.width,self.height);
		clearInterval(self.interval);
		return self;
	};
	Shape.prototype.start = function(gap){
		var self = this;
		self.started = (new Date()) - 0;
		self.interval = setInterval(function(){
			if(self.pixels.length) self.putPixel(0,0,0);
			else self.stop();
		},gap||_gap);
		return self;
	};
	Shape.prototype.stop = function(){
		clearInterval(this.interval);
		return this;
	};
	Shape.prototype.test = function(guess){
		return this.name.toLowerCase()===guess.toLowerCase();
	};
	Shape.prototype.done = function(){
		return this.total - this.pixels.length;
	};
	Shape.prototype.percent = function(){
		return this.done()/this.total;
	};
	Shape.prototype.time = function(){
		 return (new Date()) - this.started;
	};
	Shape.prototype.show = function(){
		this.canvas.style.display = "block";
		return this;
	};
	Shape.prototype.hide = function(){
		this.canvas.style.display = "none";
		return this;
	};

	//------------------------------------------------------------------
	//Public
	function addShape(name,draw,test) {
		return new Shape(name,draw,test);
	};
	function testShape(name,guess) {
		return _shapes[name].test(guess);
	};
	function listShapes() {
		var list = [];
		for(var i in _shapes) if (_shapes.hasOwnProperty(i)) list.push(i);
		return list;
	};
	function listShapeKeys() {
		var list = {};
		for(var i in _shapes) if (_shapes.hasOwnProperty(i)) list[_shapes[i].key] = i;
		return list;
	};
	function eachShape(callback) {
		for(var i in _shapes) if (_shapes.hasOwnProperty(i)) callback.call(_shapes[i]);
	};
	function randShape(){
		var lst = listShapes();
		var i = rand1(lst.length);
		return _shapes[lst[i]];
	};

	return {
		add:addShape,
		test:testShape,
		list:listShapes,
		keys:listShapeKeys,
		each:eachShape,
		random:randShape,
		rand1:rand1,
		rand2:rand2
	};
	
})();

//=============================================================
var model = (function() {

	var ls = function(a,b){return b?{get:function(c){return a[c]&&b.parse(a[c])},set:function(c,d){a[c]=b.stringify(d)}}:{}}(window.localStorage||{},JSON);

	var _totals = {};
	var _logs = ls.get("_logs") || [];
	var _uaid = 'UA-22107593-7';
	var _uadm = 'shapex.org';
	
	//Initialize Google Analytics
	var init = function() {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
		if (ga) { ga('create', _uaid, _uadm); ga('send', 'pageview'); }
	};

	//Custom UA Event
	var result = function(shape,guess,correct,total,done,time,image) {
		image = image.substr('data:image/png;base64,'.length).replace(/\+/g,'-').replace(/\//g,'_') + ".shape";
		var url = ["/",shape,"/",guess,"/",total,"/",done,"/",time,"/",image].join('');		
		if (ga) ga('send', 'event', 'click', shape + '_' + guess + '_' + total + '_' + done + '_' + time, correct, done);
		if (ga) ga('send', {'hitType':'pageview', 'page':shape + '_' + guess});
		return url;
	};

	var total = function(shape, guess, correct, total, done, time, image) {
		var amend = function(tshape) {
			tshape[guess] = tshape[guess] ? tshape[guess] + 1 : 1;
			if(!correct) {
				tshape.incorrect[guess] = tshape.incorrect[guess]?tshape.incorrect[guess]+1:1;
				tshape.incorrect.total++;
			} else {
				var shapecount = ++tshape.count - tshape.incorrect.total;
				tshape.done+=done, tshape.total+=total, tshape.done+=done, tshape.time+=time;			
				tshape.avg_time = tshape.time/shapecount; 
				tshape.avg_done = tshape.done/shapecount;
				tshape.avg_percent = tshape.done/tshape.total;
				if(!tshape.best_done || tshape.best_done>done) tshape.best_done = done;
				if(!tshape.best_time || tshape.best_time>time) tshape.best_time = time;
				if(!tshape.best_percent || tshape.best_done>done) tshape.best_percent = tshape.avg_percent;
			}
		};
		_totals.grand  = _totals.grand  || {count:0,done:0,total:0,time:0,best_done:0,best_percent:0,best_time:0,incorrect:{total:0}};
		_totals[shape] = _totals[shape] || {count:0,done:0,total:0,time:0,best_done:0,best_percent:0,best_time:0,incorrect:{total:0}};
		amend(_totals.grand);
		amend(_totals[shape]);
		ls.set("_totals",_totals);
		return _totals;
	};

	var log = function(shape, guess, correct, total, done, time, image) {
		var timestamp = ((new Date())-0);
		var item = {shape:shape, guess:guess, correct:correct, total:total, done:done, time:time, image:image, timestamp: timestamp };
		_logs.push(item);
		ls.set("_logs",_logs);
		return item
	};
	
	return { init:init, result:result, log:log, total:total, logs:function(){return _logs;},totals:function(){return _totals;} };

})();

//==============================================================
var ui = (function() {

	var _begin = document.getElementById("begin"),
		 _accept = document.getElementById("accept"),
		 _social = document.getElementById("social"),
		 _message = document.getElementById("message"),
		 _cookies = document.getElementById("cookies"),
		 _experiment = document.getElementById("experiment"),
		 _results = document.getElementById("results"),
		 _total = document.getElementById("total"),
		 _totals = document.getElementById("totals"),
		 _facebook = document.getElementById("facebook"),
		 _twitter = document.getElementById("twitter"),
		 _about = document.getElementById("about"),
		 _url = "http://shapex.org",
		 _shape = null;

	var polygon = function(ctx,color,vrt) {
		ctx.beginPath();
		ctx.fillStyle=color;
		ctx.moveTo.apply(ctx,vrt[0]);
		for(var i=1,l=vrt.length;i<l;i++) ctx.lineTo.apply(ctx,vrt[i]);  
		ctx.lineTo.apply(ctx,vrt[0]);
		ctx.fill();
		ctx.closePath();
	}

	var circle = shape.add("circle",function(color){
		var ctr = this.width/2;
		var rad = this.width/2-11;
		var ctx = this.context;
		ctx.beginPath();
		ctx.fillStyle=color; 
		ctx.arc(ctr, ctr, rad, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
	});

	var triangle = shape.add("triangle",function(color){
		polygon(this.context,color,[[15,85],[50,15],[85,85]]);
	});

	var square = shape.add("square",function(color){
		var margin = 15;
		this.context.fillStyle=color;
		this.context.fillRect(margin, margin, this.width-margin*2, this.width-margin*2);
	});

	var pentagon = shape.add("pentagon",function(color){
		polygon(this.context,color,[[25,85],[15,40],[50,15],[85,40],[75,85]]);
	});
	
	var donut = shape.add("donut",function(color){
		var ctr = this.width/2;
		var rad = this.width/2-11;
		var ctx = this.context;
		ctx.beginPath();
		ctx.fillStyle=color;
		ctx.arc(ctr, ctr, rad, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle="rgba(255,255,255,1.0)";
		ctx.arc(ctr, ctr, rad/3.7, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
	});

	var star = shape.add("star",function(color){
		polygon(this.context,color,[[50,10],[35,35],[10,40],[28,58],[20,85],[50,72],[80,85],[72,58],[90,40],[65,35]]);
	});

	var bars = shape.add("bars",function(color){
		var margin = 15;
		var height = Math.floor((this.height-margin)/2.6);
		var width  = this.width-margin*2;
		this.context.fillStyle=color;
		this.context.fillRect(margin, margin, width, height);
		this.context.fillRect(margin, this.height-height-margin, width, height);
	});
	
	var diamond = shape.add("diamond",function(color){
		polygon(this.context,color,[[50,15],[85,50],[50,85],[15,50]]);
	});
	
	var record = function(shape, guess, correct, total, done, time, image) {
		var img = document.createElement("img");
		var url = model.result.apply(this,arguments);
		img.className = 'pixel';
		img.src = url;
		return img;
	}; 
	
	var tally = function(shape,bpct,btime,apct,atime) {
		_total.style.display="block";
		var tr = document.getElementById("total_"+shape);
		var isnew = tr?0:1;
		if(isnew) {
			
			tr = document.createElement("tr");
			tr.setAttribute("id","total_"+shape);
			_totals.appendChild(tr);
		}

		for(var i=0,l=arguments.length;i<l;i++) {
			var tag = !i?'':i%2?'%':'s';
			var td  = isnew ? document.createElement("td") : tr.cells[i];
			td.textContent = (((i>0) ? parseInt(arguments[i]*100)/100:arguments[i])||0) + tag;
			isnew && tr.appendChild(td);
		}
	};

	var display = function(shape, guess, correct, total, done, time, image, nolog) {
		var li  = document.createElement("li");
		var classes = [correct?'correct':'incorrect',guess,'log'];
		var percent = done/total;
		var container = document.createElement("div");
		var info1 = document.createElement("div");
		var info2 = document.createElement("div");
		var thumb = document.createElement("img");
		thumb.src = image;
		info1.textContent = '| ' + shape + ' |  ' + (parseInt(percent * 10000)/100) + '%   |  ' + (parseInt(percent * 10000)/100) + ' seconds | '; 
		info2.textContent = '( ' + guess + ' ' +done + ' )';
		container.appendChild(info2);
		container.appendChild(thumb);
		container.className = "hidden";
		if(!nolog) li.appendChild(record.apply(this,arguments)); 		
		li.setAttribute("class",classes.join(' '));
		li.appendChild(info1);
		li.appendChild(container);
		if(_results.getElementsByTagName("li").length) { 
			_results.insertBefore(li,_results.firstChild);
		} else {
			_results.appendChild(li);
		}
		var toggle = function(){ container.style.display=container.style.display==='block'?'none':'block'; };
		li.onclick = toggle;
		li.touchend = toggle;
	};



	var facebook = function() {
		//Show the like button:
		var root = document.getElementById("fb-root");
		var div = document.createElement("div");
				
		//Initialize Facebook
		(function(d, s, id) {
		  var js, fjs = d.getElementsByTagName(s)[0];
		  if (d.getElementById(id)) return;
		  js = d.createElement(s); js.id = id;
		  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
		  fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));

		//Show like button
		div.className = "fb-like";
		div.setAttribute("data-href",_url);
		div.setAttribute("data-send","false");
		div.setAttribute("data-layout","button_count");
		div.setAttribute("data-width","450");
		div.setAttribute("data-show-faces","false");
		root.appendChild(div);
		root.style.display = "inline-block";
		return false;
	};
	
	var twitter = function() {
		var root = document.getElementById("tw-root");
		var link = document.createElement("a");
		link.className = "twitter-share-button";
		link.href="https://twitter.com/share";
		link.setAttribute("data-url",_url); 
		link.setAttribute("data-hashtags","shapex");
		link.textContent = "Tweet";
		root.appendChild(link);
		root.style.display="inline-block";
		!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
		return false;			
	};

	//Restarts the shape sequence
	var restart = function(){
		if(_shape) {
			_shape.stop().redraw().hide();
			_shape = shape.random().show().start();
		}
	};

	//Window keypress event handler
	var keypress = function(e) {
		var key = (e.keyCode||e.which) - 48;
		if (key>0 && key<9) answer(shape.keys()[key]);
	};

	//------------------------------------------------------------------
	//Public
	var about = function() {		
		var root = document.getElementById("ab-root");
		root.style.display="inline-block";				
		return false;
	};
	
	var social = function() {
		facebook();
		twitter();
		about();
		_social.style.display = "none";
	};

	var info = function(){
		var style = document.getElementById("info").style;
		style.display = style.display==="block"?"none":"block";
	};

	var init = function(){
		model.init();
		var logs = model.logs();
		var totals = model.totals();
		_accept.style.display = "none";
		_message.style.display = "none";
		_experiment.style.display = "block";
		_shape = shape.random().show().start();
		window.addEventListener("keypress",keypress);
		for(var i=0,l=logs.length;i<l;i++) {
			var lg = logs[i]; display(lg.shape, lg.guess, lg.correct, lg.total, lg.done, lg.time, lg.image, true);
			model.total.call(this,lg.shape, lg.guess, lg.correct, lg.total, lg.done, lg.time, lg.image);
		};
		for(var i in totals) {
			if(totals.hasOwnProperty(i)) {
				var t = totals[i];
				tally(i,t.best_percent*100,t.best_time/1000,t.avg_percent*100,t.avg_time/1000);
			}
		}
		social();
	};
	
	//Marks the shape as incorrect or correct sends to the 
	var answer = function(guess){
		if (_shape) {
			var name = _shape.name;
			var image = _shape.canvas.toDataURL(0,0,_shape.width,_shape.height);
			var correct = _shape.test(guess);

			var args = [name, guess, correct, _shape.total, _shape.done(), _shape.time(), image];
			var totals = model.total.apply(this,args);
			model.log.apply(this,args);
			display.apply(this,args);

			var t = totals[name], g = totals.grand;
			tally('grand',g.best_percent*100,g.best_time/1000,g.avg_percent*100,g.avg_time/1000);
			tally(name,t.best_percent*100,t.best_time/1000,t.avg_percent*100,t.avg_time/1000);

			restart();
		}
	};
	
	shape.each(function(){ var self = this; self.button.onclick = function(){ answer(self.name); }; });

	//Begin button!
	_begin.onclick = init;
	
	//JS Links
	_cookies.onclick= info;
	_facebook.onclick = social;
	_twitter.onclick = social;
	_about.onclick = social;
	
	return { 
		answer:answer,
		about:about,
		info:info,
		social:social
	};
	
})();