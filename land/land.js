var land = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	this.id = false;
	this.rivers_map = false;
	this.sand_map = false;

	this.init = function () {
		this.m = []; this.w = [];
		this.rivers_map = [];
		this.sand_map = [];

		for (var y=0;y<this.c.size[1];y++) {
			this.rivers_map[y] = [];
			this.sand_map[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				this.rivers_map[y][x] = 0;
				this.sand_map[y][x] = 0;
			}
		}

		var tmp = generateTerrainMap(this.c.size[0]>this.c.size[1]?this.c.size[0]:this.c.size[1], 1, this.c.roughness);
		tmp = this._smooth(tmp,this.c.smooth);
		if (this.c.coast.top)    this.water_border(tmp, 'top');
		if (this.c.coast.bottom) this.water_border(tmp, 'bottom');
		if (this.c.coast.left)   this.water_border(tmp, 'left');
		if (this.c.coast.right)  this.water_border(tmp, 'right');
		tmp = this._smooth(tmp, 1);
		
		this.river(tmp);
		
		var t = false;
		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				t = this.data_by_level(tmp[y][x]);
				this.m[y][x] = { type: t.type, id: 0 };
				this.w[y][x] = t.w;
			}
		}
		this.restore();
		this.clean();
	}
	
	this.get = function () {
		return { map: this.m, walk: this.w };
	}
	
	this.restore = function () {
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (this.rivers_map[y][x] > 0) {
					this.m[y][x].type = 'river';
				} else if (this.sand_map[y][x] > 0 && this.m[y][x].type == 'ground') {
					this.m[y][x].type = 'sand';
				}
			}
		}
	}

	this.clean = function () {
		var tmp = [];
		var this_point_type = false;
		var same_points_near = 0;
		var this_point_neighbours = { };
		// copy map
		for (var y=0;y<this.c.size[1];y++) {
			tmp[y]=[];
			for (var x=0;x<this.c.size[0];x++) {
				tmp[y][x]=this.m[y][x].type;
			}
		}

		for (var y=1;y<this.c.size[1]-1;y++) {
			for (var x=1;x<this.c.size[0]-1;x++) {
				this_point_type = this.m[y][x].type;
				this_point_neighbours = {};
				same_points_near = 0;
				for (var ny = y-1; ny <= y+1; ny++) {
					for (var nx = x-1; nx <= x+1; nx++) {
						if (this.m[ny][nx].type == this_point_type) {
							same_points_near++;
						} else {
							if (typeof this_point_neighbours[this.m[ny][nx].type] == 'undefined') this_point_neighbours[this.m[ny][nx].type]=0;
							this_point_neighbours[this.m[ny][nx].type]++;
						}
					}
				}
				if (same_points_near === 1) {	// only this point
					same_points_near = 0;
					for (var point_type in this_point_neighbours) {
						if (typeof this_point_neighbours[point_type] !='undefined' && this_point_neighbours[point_type]>same_points_near) {
							same_points_near = this_point_neighbours[point_type];
							this_point_type = point_type;
						}
					}
					tmp[y][x] = this_point_type;
				}
			}
		}
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				this.m[y][x].type = tmp[y][x];
			}
		}
		tmp = null;
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
	
	this.river = function (map) {
		var starts = [];
		var ends = {
				'top': [],
				'bottom': [],
				'left': [],
				'right': [],
			};
		var where = false;
		var rivers = [];
		
		var r = [ false, false ];
		// prepare graph for [javascript-astar](https://github.com/bgrins/javascript-astar)
		var g = [];
		for (var y=0;y<this.c.size[1];y++) {
			g[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				g[y][x] = (map[y][x]*this.rnd(1,10))+1;	// value should be bigger that 1, or will be set as "wall"
				if (map[y][x]>=this.c.rivers.from[0] && map[y][x]<=this.c.rivers.from[1]) {
					starts.push([x,y]);
				}
				if (map[y][x]>=this.c.rivers.to[0] && map[y][x]<=this.c.rivers.to[1]) {
					where = false;
					// Yep, this will overlap left/right and top/bottom
					if (x>=0 && x<this.c.coast.distance) {
						where = 'left';
					} else if (x>=this.c.size[0]-this.c.coast.distance && x<this.c.size[0]) {
						where = 'right'
					} else if (y>=0 && y<this.c.coast.distance) {
						where = 'top';
					} else if (y>=this.c.size[1]-this.c.coast.distance && y<this.c.size[1]) {
						where = 'bottom'
					}
					if (where !== false)  {
						ends[where].push([x,y]);
					}
				}
			}
		}
		for (var i = 0; i < this.c.rivers.max; i++) {
			where = false;
			r=[starts[this.rnd(0,starts.length-1)], false];
			if (r[0][0] < this.c.size[0]/2 && r[0][1] < this.c.size[0]/2) {
				where = Math.random()>0.5?'top':'left';
				if (ends[where].length == 0 && where == 'top') where = 'left';
				if (ends[where].length != 0) { r[1] = ends[where]; where = true; }
			} else if (r[0][0] >= this.c.size[0]/2 && r[0][1] < this.c.size[0]/2) {
				where = Math.random()>0.5?'top':'right';
				if (ends[where].length == 0 && where == 'top') where = 'right';
				if (ends[where].length != 0) { r[1] = ends[where]; where = true; }
			} else if (r[0][0] >= this.c.size[0]/2 && r[0][1] >= this.c.size[0]/2) {
				where = Math.random()>0.5?'bottom':'right';
				if (ends[where].length == 0 && where == 'bottom') where = 'right';
				if (ends[where].length != 0) { r[1] = ends[where]; where = true; }
			} else if (r[0][0] < this.c.size[0]/2 && r[0][1] >= this.c.size[0]/2) {
				where = Math.random()>0.5?'bottom':'left';
				if (ends[where].length == 0 && where == 'bottom') where = 'left';
				if (ends[where].length != 0) { r[1] = ends[where]; where = true; }
			}
			
			if (where !== true) {
				// oh, well, nothing?
				r[1]=[];
				for (var y=0;y<this.c.size[1];y++) {
					for (var x=0;x<this.c.size[0];x++) {
						if (map[y][x].type=='water' || map[y][x].type=='deepwater') {
							r[1].push([x,y]);
						}
					}
				}
				if (tmp.length == 0) {
					// rly?
					for (var j=0;j<this.c.rivers.max; j++) {
						r[1].push([this.rnd(0,this.c.size[0]-1),this.rnd(0,this.c.size[1]-1)]);
					}
				}
			}
			r[1]=r[1][this.rnd(0,r[1].length-1)];
			rivers.push(r);
		}
		var g = new Graph(g);
		for (var i = 0; i < this.c.rivers.max; i++) {
			r = rivers[i];
			r = astar.search(g, g.grid[r[0][0]][r[0][1]], g.grid[r[1][0]][r[1][1]]);
			this._river_draw(map, r);
		}
	}
	
	this._river_draw = function (map, river) {
		var water_value = 0.34;
		var step = 1.5/(river.length-1);	// first value is the bigest brush "radius" ("square" radius, I don't want to use sin/cos)
		for (var j = 0; j < river.length; j++) {
			if (map[river[j].y][river[j].x]>water_value) {
				this._depth_brush (map, [river[j].x, river[j].y], step*j, water_value, 'river');
			}
		}
	}
	
	this._depth_brush = function (map, pos, r, depth, type) {
		var bpos = [0,0];
		for (var ny = pos[1]-r; ny <= pos[1]+r; ny++) {
			for (var nx = pos[0]-r; nx <= pos[0]+r; nx++) {
				bpos = [Math.round(nx), Math.round(ny)];
				map[bpos[1]][bpos[0]] = depth;
				if (type == 'river') {
					// TODO set ID of the river?
					try {this.rivers_map[bpos[1]][bpos[0]]=1;} catch (e) { /* nah */ }
				}
			}
		}
	}
	
	
	this.water_border = function (map, where) {
		var g = [ [0,0], [0,0], [0,0] ];	// { [x0,y0], [x1,y1], [min,max] }
		var pre = false;
		var d = false;
		var s = (where == 'top' || where == 'bottom')?this.c.size[0]:this.c.size[1];
		var rnd_vals = (where =='top' || where == 'left')?([1,this.c.coast.distance]):([s-this.c.coast.distance, s-1]);
		for (var i = 0; i < s; i++) {
			if (pre == false) {
				pre = this.rnd(rnd_vals[0], rnd_vals[1]);
			}
			d=pre+this.rnd(1,3)-2;
			if (d > rnd_vals[1]) d = rnd_vals[1];
			if (d < rnd_vals[0]) d = rnd_vals[0];
			pre = d;
			if (where == 'top') {
				this._gradient(map, [ [i,0], [i,d], [0, this.c.coast.level] ], true, 'set_sand');
			} else if (where == 'bottom') {
				this._gradient(map, [ [i,s], [i,d], [0, this.c.coast.level] ], true, 'set_sand');
			} else if (where == 'left') {
				this._gradient(map, [ [0,i], [d,i], [0, this.c.coast.level] ], true, 'set_sand');
			} else if (where == 'right') {
				this._gradient(map, [ [s,i], [d,i], [0, this.c.coast.level] ], true, 'set_sand');
			}
		}
	}
	this._gradient = function (map, g, replace_lower, extra) {
		var steps = this.distance(g[0], g[1]);
		var d = [ (g[1][0]-g[0][0])/steps, (g[1][1]-g[0][1])/steps, (g[2][1]-g[2][0])/steps ];
		var pos = [g[0][0], g[0][1], g[2][0]];
		map[pos[1]][pos[0]] = pos[2];
		for (var step = 0; step < steps; step++) {
			pos[0]+=d[0];
			pos[1]+=d[1];
			pos[2]+=d[2];
			if (replace_lower && map[Math.round(pos[1])][Math.round(pos[0])] < pos[2]) {
			} else {
				map[Math.round(pos[1])][Math.round(pos[0])] = pos[2];
			}
			if (extra == 'set_sand' && pos[2]>g[2][1]-this.c.coast.sand) {
				try { this.sand_map[Math.round(pos[1])][Math.round(pos[0])] = 1; } catch (e) { }
				try { if (Math.random()>0.5) { this.sand_map[Math.round(pos[1]+d[1])][Math.round(pos[0]+d[0])] = 1;} } catch (e) { }
			}

		}
	}
	
	this._smooth = function (map, v) {
		var newmap = [];
		for (var y=0;y<map.length;y++) {
			newmap[y] = [];
			for (var x=0;x<map[y].length;x++) {
				newmap[y][x] = this._smooth_avg(map , [x,y], v);
			}
		}
		return newmap;
	}
	
	this._smooth_avg = function (map, pos, d) {
		var s = 0;
		var c = 0;
		for (var y = pos[1]-d; y <= pos[1]+d; y++) {
			for (var x = pos[0]-d; x <= pos[0]+d; x++) {
				if (typeof map[y] != 'undefined' && typeof[map[y][x]] != 'undefined' && map[y][x]<=1 && map[y][x]>=0) {
					s += map[y][x];
					c++;
				}
			}
		}
		return s/c;
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
