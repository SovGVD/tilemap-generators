var land = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	this.id = false;
	
	this.init = function () {
		this.m = []; this.w = [];

		var tmp = generateTerrainMap(this.c.size[0]>this.c.size[1]?this.c.size[0]:this.c.size[1], 1, this.c.roughness);
		if (this.c.water.top)    this.water_border(tmp, 'top');
		if (this.c.water.bottom) this.water_border(tmp, 'bottom');
		if (this.c.water.left)   this.water_border(tmp, 'left');
		if (this.c.water.right)  this.water_border(tmp, 'right');
		var t = false;
		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				t = this.data_by_level(tmp[y][x]);
				this.m[y][x] = { type: t.type, id: 0 };
				this.w[y][x] = t.w;
			}
		}
	}
	
	this.get = function () {
		return { map: this.m, walk: this.w };
	}

	this.data_by_level = function (level) {
		if (level < 0) level = 0;
		if (level > 1) level = 1;
		for (var i = 0; i < this.c.levels.length; i++) {
			if (this.c.levels[i].values[0]<=level && (this.c.levels[i].values[1]>level || (this.c.levels[i].values[1]>=level && this.c.levels[i].values[1] === 1))) {
				return { type: this.c.levels[i].type, w: this.c.levels[i].walkable };
			}
		}
		return { type: 'none', walkable: 0 }
	}
	
	this.water_border = function (map, where) {
		// TODO `where`
		var g = [ [0,0], [0,0], [0,0] ];	// { [x0,y0], [x1,y1], [min,max] }
		var pre = false;
		var d = false;
		var s = (where == 'top' || where == 'bottom')?this.c.size[0]:this.c.size[1];
		var rnd_vals = (where =='top' || where == 'left')?([1,this.c.water.distance]):([s-this.c.water.distance, s-1]);
		for (var i = 0; i < s; i++) {
			if (pre == false) {
				pre = this.rnd(rnd_vals[0], rnd_vals[1]);
			}
			d=pre+this.rnd(1,3)-2;
			if (d > rnd_vals[1]) d = rnd_vals[1];
			if (d < rnd_vals[0]) d = rnd_vals[0];
			pre = d;
			if (where == 'top') {
				this._gradient(map, [ [i,0], [i,d], [0, this.c.water.level] ]);
			} else if (where == 'bottom') {
				this._gradient(map, [ [i,s], [i,d], [0, this.c.water.level] ]);
			} else if (where == 'left') {
				this._gradient(map, [ [0,i], [d,i], [0, this.c.water.level] ]);
			} else if (where == 'right') {
				this._gradient(map, [ [s,i], [d,i], [0, this.c.water.level] ]);
			}
		}
	}
	this._gradient = function (map, g) {
		var steps = this.distance(g[0], g[1]);
		var d = [ (g[1][0]-g[0][0])/steps, (g[1][1]-g[0][1])/steps, (g[2][1]-g[2][0])/steps ];
		var pos = [g[0][0], g[0][1], g[2][0]];
		map[pos[1]][pos[0]] = pos[2];
		for (var step = 0; step < steps; step++) {
			pos[0]+=d[0];
			pos[1]+=d[1];
			pos[2]+=d[2];
			map[Math.round(pos[1])][Math.round(pos[0])] = pos[2];
		}
	}
	
	// help functions

	this.distance = function (pos0, pos1) {
		return Math.round(Math.sqrt(Math.pow(pos0[0]-pos1[0],2)+Math.pow(pos0[1]+pos1[1],2)));
	}
	this.rnd = function (min, max) {
		return parseInt((Math.random()*(max-min+1)+min));
	}
	
	this.shuffle = function (arr) {
		for (var i = arr.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = arr[i];
			arr[i] = arr[j];
			arr[j] = temp;
		}
		return arr;
	}
	
	this.init(c);
}
