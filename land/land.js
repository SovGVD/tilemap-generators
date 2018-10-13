var land = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	this.id = false;
	this.rivers_map = false;
	this.sand_map = false;
	this.moisture_map = false;
	this.city_map = false;
	this.road_map = false;
	this.count_levels = 0;
	this.ms = new Date().getTime();
	this.use_canvas_smooth = false;	// TODO, as the 256 levels is not enough
	this._smooth_canvas = false;
	this._smooth_ctx = false;
	this._terrain_size = false;
	
	
	this._dbg_timer = function (txt) {
		var tmp = new Date().getTime();
		console.log("Time: ["+txt+"]", tmp - this.ms);
		this.ms = tmp;
	}

	this.init = function () {
		this._terrain_size = this.c.size[0]>this.c.size[1]?this.c.size[0]:this.c.size[1];	// TODO find where else it could be used (var l = map.length ??)
		console.log("Terrain size", this._terrain_size);
		this.count_levels = this.c.levels.length;
		if (this.use_canvas_smooth) {
			this._smooth_canvas = document.createElement('canvas');
			this._smooth_ctx = this._smooth_canvas.getContext('2d');
			this._smooth_ctx.canvas.width = this._terrain_size;
			this._smooth_ctx.canvas.height = this._terrain_size;
			document.getElementById("dbg2").append(this._smooth_canvas);
		}

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
		this._dbg_timer("map1");

		var tmp = generateTerrainMap(this._terrain_size, 1, this.c.roughness);
		this._dbg_timer("terrain");
		tmp = this._smooth(tmp,this.c.smooth);
		this._dbg_timer("terrain smooth");
		if (this.c.coast.top)    this.water_border(tmp, 'top');
		if (this.c.coast.bottom) this.water_border(tmp, 'bottom');
		if (this.c.coast.left)   this.water_border(tmp, 'left');
		if (this.c.coast.right)  this.water_border(tmp, 'right');
		this._dbg_timer("water border");
		tmp = this._smooth(tmp, 1);
		this._dbg_timer("smooth again");
		
		this.river(tmp);
		this._dbg_timer("rivers");
		this.moisture_map = this._binary_map(tmp, ['water','deepwater'], 1, parseInt(this.c.size[0]/15));
		this._dbg_timer("moisture binary map");
		this.moisture_map = this._smooth(this.moisture_map,this.c.smooth*2);
		this._dbg_timer("moisture smooth");
		
		var t = false;
		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				t = this.data_by_level(tmp[y][x]);
				this.m[y][x] = { type: t.type, id: 0 };
				this.w[y][x] = t.w;
			}
		}
		this._dbg_timer("map2");
		this.restore();
		this._dbg_timer("restore");
		this.expand_ground_types();
		this._dbg_timer("expand");
		this.clean();
		this._dbg_timer("clean");
		
		// City
		this.city();
		this._dbg_timer("city");
		tmp = null;
	}
	
	this.get = function () {
		return { map: this.m, walk: this.w };
	}
	
	this._invert = function (map) {
		for (var y=0;y<map.length;y++) {
			for (var x=0;x<map[y].length;x++) {
				map[y][x]=1-map[y][x];
			}
		}
		return map;
	}

	this._city_position = function (poi, box) {
		var pois = [];
		var max = -1;
		var v = 0;
		for (var y = box.y0; y < box.y1; y++) {
			for (var x = box.x0; x < box.x1; x++) {
				if (this.isset(poi[y]) && this.isset(poi[y][x]) && poi[y][x] > 0) {
					v = poi[y][x];
					if (!this.isset(pois[v])) pois[v] = [];
					pois[v].push({ pos: [x,y], value: v });
					if (max < v) max = v;
				}
			}
		}
		if (max == -1) {
			return false;
		}
		return pois[max][this.rnd(0,pois[max].length-1)];
	}
	
	this.city = function () {
		var poi = [];
		this.city_map = [];
		this.road_map = {};
		var n = false;
		var delta = 3;
		// set POI levels according to nearest neighbours
		for (var y=0;y<this.c.size[1];y++) {
			poi[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				if (!this.isset(poi[y][x])) poi[y][x] = 0;
				n = this._neighbours([x,y],delta);
				if (this.isset(n.neighbours.river) && (n.point_type == 'ground' || n.point_type == 'rock' || n.point_type == 'desert')  && n.same_points_near/n.neighbours.river>=1) {
					poi[y][x] += 3;
				}
				if (this.isset(n.neighbours.water) && n.point_type == 'ground' && n.same_points_near/n.neighbours.water>=1.5) {
					poi[y][x]++;
				}
				if (this.isset(n.neighbours.water) && this.isset(n.neighbours.sand) && n.point_type == 'ground' && n.same_points_near/(n.neighbours.water + n.neighbours.sand)>=1) {
					poi[y][x] += 3;
				}
				if (this.isset(n.neighbours.river) && this.isset(n.neighbours.rock) && n.point_type == 'ground' && n.same_points_near/(n.neighbours.river + n.neighbours.rock)>=1) {
					poi[y][x] += 2;
				}
				if (this.isset(n.neighbours.river) && this.isset(n.neighbours.snow)) {
					poi[y][x] += 2;
				}
				if (this.isset(n.neighbours.rock) && this.isset(n.neighbours.desert) && n.point_type == 'ground' && n.same_points_near/(n.neighbours.rock + n.neighbours.desert)>=1) {
					poi[y][x] += 2;
				}
			}
		}
		/*for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (poi[y][x] > 5){
					this.m[y][x].type = 'unknown';
					this.m[y][x].dbg = poi[y][x];
				} else if (poi[y][x] > 0) {
					this.m[y][x].type = 'none';
					this.m[y][x].dbg = poi[y][x];
				}
			}
		}*/
		var delta = {
				x: Math.round(this.c.size[0]/Math.sqrt(this.c.city.max))+1,
				y: Math.round(this.c.size[1]/Math.sqrt(this.c.city.max))+1
			};
		var pos = [0,0];
		for (var y=0;y<this.c.size[1];y+=delta.y) {
			for (var x=0;x<this.c.size[0];x+=delta.x) {
				n = this._city_position(poi, {
						x0: x,
						y0: y,
						x1: x+delta.x,
						y1: y+delta.y
					});
				if (n !== false) {
					this.city_map.push(n);
					this.m[n.pos[1]][n.pos[0]].type='city';
				}
			}
		}

		var g = [];
		var r = false;
		for (var x=0;x<this.c.size[0];x++) {
			g[x] = [];
			for (var y=0;y<this.c.size[1];y++) {
				if (this.w[y][x]>0) {
					if (this.m[y][x].type == 'river') {
						g[x][y] = 0;
					} else {
						g[x][y] = 1;
					}
				} else {
					g[x][y] = 0;
				}
			}
		}
		g = this._smooth(g, 9);
		for (var x=0;x<this.c.size[0];x++) {
			for (var y=0;y<this.c.size[1];y++) {
				if (this.w[y][x]>0) {
					if (this.m[y][x].type == 'river') {
						g[x][y] = Math.random()>0.8?1:0;
					} else {
						g[x][y] = g[x][y]*10+10;
					}
				} else {
					g[x][y] = 0;
				}
			}
		}
		
		var gr = new Graph(g);
		for (var i = 0; i < this.city_map.length; i++) {
			var best = { path: false, value: false };
			for (var j = i+1; j < this.city_map.length; j++) {
				//console.log("road from", i, "to", j);
				// TODO don't make too much roads from one city
				r = astar.search(gr, 
					gr.grid[this.city_map[i].pos[0]][this.city_map[i].pos[1]], 
					gr.grid[this.city_map[j].pos[0]][this.city_map[j].pos[1]]
					);
				console.log("road from", i, "to", j);
				if (r.length > 0) {
					this.road_map[(i+"-"+j)] = r;
					if (best.value === false || best.value > r.length) best = { path: (i+"-"+j), value: r.length };
				}
			}
			if (best.path !== false) {
				console.log("Best way", best);
				this._draw_road(this.road_map[best.path], g);
				gr = new Graph(g);
			} else {
				// TODO no road to city... remove?
			}
		}
		poi = null;
	}
	
	this._draw_road = function (r, g) {
		console.log("Draw", r);
		for (var j = 0; j < r.length; j++) {
			if (this.m[r[j].y][r[j].x].type == 'road') break;
			if (this.m[r[j].y][r[j].x].type != 'river') {
				this.m[r[j].y][r[j].x].type = 'road';
			} else {
				this.m[r[j].y][r[j].x].type = 'bridge';
			}
			g[r[j].x][r[j].y] = 100000;
			this.w[r[j].y][r[j].x]=1;
		}
	}
	
	this._binary_map = function (map, binary_types, fill_border, expand) {
		var t = false;
		var newmap = [];
		var nnewmap = [];
		var l=map.length;
		for (var y=0;y<l;y++) {
			newmap[y] = [];
			nnewmap[y] = [];
			for (var x=0;x<l;x++) {
				t = this.data_by_level(map[y][x]);
				if (binary_types.indexOf(t.type) > -1) {
					newmap[y][x] = 1;
					nnewmap[y][x] = 1;
				} else {
					newmap[y][x] = 0;
					nnewmap[y][x] = 0;
				}
			}
		}
		this._dbg_timer("moisture binary map init");
		var d = Math.round(expand/8);	// dramaticaly speed up
		if (d<=0) d=2;
		for (var y=0;y<l;y=y+d) {
			for (var x=0;x<l;x=x+d) {
				if (y>=0 && y<l && x>=0 && x<l && newmap[y][x] == 1) this._depth_brush (nnewmap, [x,y], expand, 1, false);
			}
		}
		newmap = null;
		return nnewmap;
	}
	
	this.expand_ground_types = function () {
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (this.m[y][x].type == 'ground') {
					if (this.moisture_map[y][x] < 0.35) {
						this.m[y][x].type = 'desert';
					}
				}
			}
		}
	}
	
	this.restore = function () {
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (this.rivers_map[y][x] > 0) {
					this.m[y][x].type = 'river';
					this.w[y][x] = this.rivers_map[y][x];
				} else if (this.sand_map[y][x] > 0 && this.m[y][x].type == 'ground') {
					this.m[y][x].type = 'sand';
					this.w[y][x] = 0.7;
				}
			}
		}
	}
	
	this._neighbours = function (pos, d) {
		var this_point_type = this.m[pos[1]][pos[0]].type;
		var this_point_neighbours = {};
		var same_points_near = 0;
		var max_type = { type: false, value: 0 };
		var t = false;
		var b = {
				ny_min: pos[1]-d,
				ny_max: pos[1]+d,
				nx_min: pos[0]-d,
				nx_max: pos[0]+d
			};
		if (b.ny_min < 0) b.ny_min = 0;
		if (b.nx_min < 0) b.nx_min = 0;
		if (b.ny_max > this.c.size[1]-1) b.ny_max = this.c.size[1]-1;
		if (b.nx_max > this.c.size[0]-1) b.nx_max = this.c.size[0]-1;

		for (var y = b.ny_min; y <= b.ny_max; y++) {
			for (var x = b.nx_min; x <= b.nx_max; x++) {
				if (this.m[y][x].type == this_point_type) {
					same_points_near++;
				} else {
					t = this.m[y][x].type;
					if (typeof this_point_neighbours[t] == 'undefined') this_point_neighbours[t]=0;
					this_point_neighbours[t]++;
					if (this_point_neighbours[t] > max_type.value) max_type = { type: t, value: this_point_neighbours[t] };
				}
			}
		}
		return { point_type: this_point_type, same_points_near: same_points_near, neighbours: this_point_neighbours, max: max_type };
	}

	this.clean = function () {
		var tmp = [];
		var this_point_type = false;
		var same_points_near = 0;
		var neighbours = false;
		// copy map types
		for (var y=0;y<this.c.size[1];y++) {
			tmp[y]=[];
			for (var x=0;x<this.c.size[0];x++) {
				tmp[y][x]=this.m[y][x].type;
			}
		}

		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				neighbours = this._neighbours([x,y],1);
				if (neighbours.same_points_near === 1) {	// only this point
					tmp[y][x] = neighbours.max.type;
				}
			}
		}
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				this.m[y][x].type = tmp[y][x];
			}
		}
		tmp = null;
		this.sand_map = false;
		this.moisture_map = false;
	}

	this.data_by_level = function (level) {
		if (level < 0) level = 0;
		if (level > 1) level = 1;
		for (var i = 0; i < this.count_levels; i++) {
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
		for (var x=0;x<this.c.size[0];x++) {
			g[x] = [];
			for (var y=0;y<this.c.size[1];y++) {
				g[x][y] = 0;
			}
		}
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (map[y][x] > this.c.rivers.from[1]) {
					g[x][y]=0;	// wall
				} else if (map[y][x]>=this.c.rivers.from[0] && map[y][x]<=this.c.rivers.from[1]) {
					g[x][y] = (map[y][x]*100+this.rnd(300,500))+1;
				} else {
					g[x][y] = (map[y][x]*100+this.rnd(0,100))+1;	// value should be bigger that 1, or will be set as "wall"
				}
				if (map[y][x]>=this.c.rivers.from[0] && map[y][x]<=this.c.rivers.from[1]) {
					starts.push([x,y]);
				}
				if (map[y][x]>=this.c.rivers.to[0] && map[y][x]<=this.c.rivers.to[1]) {
					where = false;
					// Yep, this will overlap left/right and top/bottom
					if (x>=0 && x<this.c.coast.distance) {
						where = 'left';
					} else if (y>=this.c.size[1]-this.c.coast.distance && y<this.c.size[1]) {
						where = 'bottom';
					} else if (x>=this.c.size[0]-this.c.coast.distance && x<this.c.size[0]) {
						where = 'right';
					} else if (y>=0 && y<this.c.coast.distance) {
						where = 'top';
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
				this._depth_brush (map, [river[j].x, river[j].y], step*j, water_value, 'river', Math.round((1-j/river.length)*5+5)/10);
			}
		}
	}
	
	this._depth_brush = function (map, pos, r, depth, type, walkable) {
		var bpos = [0,0];
		var b = {
				ny_min: Math.round(pos[1]-r),
				ny_max: Math.round(pos[1]+r),
				nx_min: Math.round(pos[0]-r),
				nx_max: Math.round(pos[0]+r)
			};
		for (var ny = b.ny_min; ny <= b.ny_max ; ny++) {
			for (var nx = b.nx_min; nx <= b.nx_max; nx++) {
				bpos = [nx, ny];
				if (bpos[0]>=0 && bpos[1]>=0 && bpos[0]<this.c.size[0] && bpos[1]<this.c.size[1]) {map[bpos[1]][bpos[0]] = depth;}
				if (type == 'river') {
					// TODO set ID of the river?
					try {this.rivers_map[bpos[1]][bpos[0]]=walkable;} catch (e) { /* nah */ }
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
		if (this.use_canvas_smooth) {	// TODO
			/*var img_data = this._smooth_ctx.createImageData(this._terrain_size+1, this._terrain_size+1);
			i=0;
			for (var y=0;y<=map.length;y++) {
				newmap[y] = [];
				for (var x=0;x<=map[y].length;x++) {
					img_data.data[i]   = 255*map[y][x];	// less levels, yep (use other channels, as it is 256^4 )
					img_data.data[i+1] = 0;
					img_data.data[i+2] = 0;
					img_data.data[i+3] = 255;
					i+=4;
				}
			}
			this._smooth_ctx.putImageData(img_data,0,0);
			this._smooth_ctx._blurRect(0, 0, this._terrain_size+1, this._terrain_size+1, v);
			i=0;
			img_data = this._smooth_ctx.getImageData(0,0,this._terrain_size+1, this._terrain_size+1);
			for (var y=0;y<=this._terrain_size;y++) {
				for (var x=0;x<=this._terrain_size;x++) {
					newmap[y][x]=img_data.data[i]/255;
					i+=4;
				}
			}*/

		} else {
			for (var y=0;y<map.length;y++) {
				newmap[y] = [];
				for (var x=0;x<map[y].length;x++) {
					newmap[y][x] = this._smooth_avg(map , [x,y], v);
				}
			}
		}
		return newmap;
	}
	
	this._smooth_avg = function (map, pos, d) {
		var s = 0;
		var c = 0;
		var b = {
				ny_min: pos[1]-d,
				ny_max: pos[1]+d,
				nx_min: pos[0]-d,
				nx_max: pos[0]+d
			};
		if (b.ny_min < 0) b.ny_min = 0;
		if (b.nx_min < 0) b.nx_min = 0;
		if (b.ny_max > map.length-1) b.ny_max = map.length-1;
		if (b.nx_max > map[0].length-1) b.nx_max = map[0].length-1;
		for (var y = b.ny_min; y <= b.ny_max; y++) {
			for (var x = b.nx_min; x <= b.nx_max; x++) {
				s += map[y][x];
				c++;
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
	this.isset = function (v) {
		return (typeof v != 'undefined');
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
