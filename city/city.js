var city = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	this.gen = false;
	this.blocks = [];
	this.id = false;
	this.count_objects = { };
	this.last_object = {
			id: 0,
			pos: [-1,-1],
			obj: false 
		};
	
	this.init = function () {
		this.m = []; this.w = [];

		this.c.buildings.min=[false, false, false];
		this.c.buildings.max=[false, false, false];
		for (var i = 0; i < this.c.buildings.types.length; i++ ) {
			if (this.c.buildings.min[0] === false || this.c.buildings.types[i].size[0] < this.c.buildings.min[0]) this.c.buildings.min[0] = this.c.buildings.types[i].size[0];
			if (this.c.buildings.min[1] === false || this.c.buildings.types[i].size[1] < this.c.buildings.min[1]) this.c.buildings.min[1] = this.c.buildings.types[i].size[1];
			if (this.c.buildings.max[0] === false || this.c.buildings.types[i].size[0] > this.c.buildings.max[0]) this.c.buildings.max[0] = this.c.buildings.types[i].size[0];
			if (this.c.buildings.max[1] === false || this.c.buildings.types[i].size[1] > this.c.buildings.max[1]) this.c.buildings.max[1] = this.c.buildings.types[i].size[1];
		}

		for (var i = 0; i < this.c.decorations.types.length; i++ ) {
			if (this.c.buildings.min[0] === false || this.c.decorations.types[i].size[0] < this.c.buildings.min[0]) this.c.buildings.min[0] = this.c.decorations.types[i].size[0];
			if (this.c.buildings.min[1] === false || this.c.decorations.types[i].size[1] < this.c.buildings.min[1]) this.c.buildings.min[1] = this.c.decorations.types[i].size[1];
			if (this.c.buildings.max[0] === false || this.c.decorations.types[i].size[0] > this.c.buildings.max[0]) this.c.buildings.max[0] = this.c.decorations.types[i].size[0];
			if (this.c.buildings.max[1] === false || this.c.decorations.types[i].size[1] > this.c.buildings.max[1]) this.c.buildings.max[1] = this.c.decorations.types[i].size[1];
		}

		// expend maximal object boundaries to fit including space_to_road for buildings
		this.c.buildings.min[0]=this.c.buildings.min[0]+this.c.buildings.space_to_road*2;
		this.c.buildings.min[1]=this.c.buildings.min[1]+this.c.buildings.space_to_road*2;
		this.c.buildings.max[0]=this.c.buildings.max[0]+this.c.buildings.space_to_road*2;
		this.c.buildings.max[1]=this.c.buildings.max[1]+this.c.buildings.space_to_road*2;

		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				//if (x==0 || y==0 || x==this.c.size[0]-1 || y==this.c.size[1]-1) {
				//	this.m[y][x] = { type: "border", id: 1 };
				//	this.w[y][x] = 0;
				//} else {
					this.m[y][x] = { type: "none", id: 0 };
					this.w[y][x] = 1;
				//}
			}
		}
		if (this.c.f.type == 'lsystem') {
			this.gen_road_lsystem(Math.random()>0.5?true:false, [0 ,0 , parseInt(this.c.size[0])-1, parseInt(this.c.size[1])-1, 2]);
		}
		this.id = this.gen_buildings_blocks_clear();
		this.gen_buildings_blocks();	
		//this.gen_finish();	
	}
	
	this.get = function () {
		return {map: this.m, walk: this.w };
	}
	
	// L-system
	// https://gamedev.stackexchange.com/questions/86234/using-l-systems-to-procedurally-generate-cities
	this.gen_road_lsystem = function (flag, block, id) {
		this.blocks.push(block); 
		var x0 = block[0];
		var y0 = block[1];
		var x1 = block[2];
		var y1 = block[3];
		var id = block[4];
		/*
			  o---> (x w)
			  |
			  |
			  v
			(y h)
		*/
		// TODO random roads shoud be connected to something else? but not on first iteration
		var w = x1-x0;
		var h = y1-y0;
		// road width
		var road = "default";
		var walkable = 1;
		for (var road_type in this.c.roads) {
			if (typeof this.c.roads[road_type].size != 'undefined' && id >= this.c.roads[road_type].iterations[0] && id <= this.c.roads[road_type].iterations[1]) {
				rw = parseInt(this.c.roads[road_type].size);
				walkable = parseFloat(this.c.roads[road_type].walkable);
				road = road_type+"";
			}
		}
		var hrw = rw/2;	// half of the road
		var d = Math.round((flag?this.rnd(x0+w/4+hrw,x1-w/4-hrw):this.rnd(y0+h/4+hrw,y1-w/4-hrw)));	// flag - vertical (by X axis)
		
		var w1 = (flag?(d-1):x1) - x0;
		var w2 = x1 - (flag?d:x0);
		var h1 = (flag?y1:(d-1)) - y0;
		var h2 = y1 - (flag?y0:d);

		// check is we have enough space for bigest building
		if ( 
			((w1 >= this.c.buildings.max[0] && h1 >= this.c.buildings.max[1]) || (w1 >= this.c.buildings.max[1] && h1 >= this.c.buildings.max[0])) && 
			((w2 >= this.c.buildings.max[0] && h2 >= this.c.buildings.max[1]) || (w2 >= this.c.buildings.max[1] && h2 >= this.c.buildings.max[0]))
			) {
			//console.log("space ", w1, "x", h1, "or", w2, "x", h2);
		} else {
			//console.log("stop");
			if (id<2) {
				// well, at the begining it is fine to ignore it
			} else {
				return false;
			}
		}


		var rl = flag?h:w;	// road length
		var ro = flag?(y0):(x0);	// road offset
		for (var i=ro;i<=(ro+rl);i++) {
			if (typeof this.m[flag?i:d] != 'undefined' && typeof this.m[flag?i:d][flag?d:i] != 'undefined') {
				var y = false;
				var x = false;
				for (var rw_id = -hrw+0.5; rw_id <= hrw; rw_id++) {
					y = Math.round(flag?i:(d+rw_id));
					x = Math.round(flag?(d+rw_id):i);
					if (x >= 0 && x < this.c.size[0] && y >= 0 && y < this.c.size[1]) {
						this.m[y][x].id = id;
						this.m[y][x].type = "road";
						this.m[y][x].sub_type = road;
						this.w[y][x] = walkable;
					}
				}
			}
		}
		if (rl>1) {
			/*
				flag=true
				+---+---+
				|   |   |
				|   |   |
				|   |   |
				+---+---+

				flag=false
				+-------+
				|       |
				+-------+
				|       |
				+-------+		
			*/
			var new_id = id+1;
			this.gen_road_lsystem(!flag, [ flag?d:x0, flag?y0:d, x1, y1, new_id ]);
			this.gen_road_lsystem(!flag, [ x0, y0, flag?(d-1):x1, flag?y1:(d-1), new_id ]);
		}
	}
	
	this.gen_buildings_blocks_clear = function () {
		var fine = false;
		var parent_id = false;
		var b = false;
		var max_id = 0;
		// remove parents
		for (var i = 0; i < this.blocks.length; i++) {
			if (this.blocks[i] !== false) {
				parent_id = this.blocks[i][4]-1;
				for (var ii = 0; ii < this.blocks.length; ii++) {
					if (i != ii && this.blocks[ii] !== false && parent_id < this.blocks[ii][4]) {	// not the same block, not removed and child
						if (
							(this.blocks[ii][0] == this.blocks[i][0] && this.blocks[ii][1] == this.blocks[i][1]) ||
							(this.blocks[ii][2] == this.blocks[i][2] && this.blocks[ii][3] == this.blocks[i][3])
						) {
							this.blocks[i] = false;
							break;	
						}
					}
				}
			}
		}
		var tmp = [];
		for (var i = 0; i < this.blocks.length; i++) {
			if (this.blocks[i] !== false) {
				tmp.push(this.blocks[i]);
				if (max_id < this.blocks[i][4]) max_id=this.blocks[i][4];
			}
		}

		this.blocks = this.shuffle(tmp);

		for (var i = 0; i < this.blocks.length; i++) {
			b = this.blocks[i];
			// align top left corner
			fine = false;
			for (var y = b[1]; y<b[3]; y++) {
				for (var x = b[0]; x<b[2]; x++) {
					if (this.m[y][x].id == 0) {
						b[0]=x;
						b[1]=y;
						fine = true;
						break;
					}
				}
				if (fine) break;
			}
			// align bottom right corner
			fine = false;
			for (var y = b[3]; y>b[1]; y--) {
				for (var x = b[2]; x>b[0]; x--) {
					if (this.m[y][x].id == 0) {
						b[2]=x;
						b[3]=y;
						fine = true;
						break;
					}
				}
				if (fine) break;
			}

		}
		return max_id;
	}


	this._gen_check_onmap = function (pos) {
		if (pos[0] >= 0 && pos[0] < this.c.size[0] && pos[1] >= 0 && pos[1] < this.c.size[1]) {
			return true;
		}
		return false;
	}

	this._gen_check_collission = function (type, pos, obj) {
		var fitted = true;
		for (var y = pos[1]; y < pos[1]+obj.size[1]; y++) {
			for (var x = pos[0]; x < pos[0]+obj.size[0]; x++) {
				if (!this._gen_check_onmap([x,y])) {
					fitted = false;
					break;
				} else if (this.m[y][x].id > 0 && !(obj.merge && typeof this.m[y][x].sub_type != 'undefined' && this.m[y][x].type == type && this.m[y][x].sub_type == obj.type)) {
					fitted = false;
					break;
				}
			}
			if (!fitted) break;
		}
		return fitted;
	}
	
	this._gen_check_border = function (type, pos, obj, delta, delta_type) {
		var fitted = true;
		for (var y = pos[1]-delta; y < pos[1]+obj.size[1]+delta; y++) {
			for (var x = pos[0]-delta; x < pos[0]+obj.size[0]+delta; x++) {
				try {
					if (
						this._gen_check_onmap([x,y]) && 
						!(obj.merge && typeof this.m[y][x].sub_type != 'undefined' && this.m[y][x].type == type && this.m[y][x].sub_type == obj.type) && 
						this.m[y][x].type != 'border' && 
						(this.m[y][x].type == delta_type || ('any' == delta_type && this.m[y][x].type != "none"))
					) {
						fitted = false;
						break;
					}
				} catch (e) {
					console.warn("Border", e, x, y, this._gen_check_onmap([x,y]));
				}
			}
			if (!fitted) break;
		}
		return fitted;
	}

	this._gen_check_distance = function (pos, obj) {
		var distance_to_center = [
			Math.abs((pos[0]-obj.size[0]/2)/(this.c.size[0]/2)-1)*100,
			Math.abs((pos[1]-obj.size[1]/2)/(this.c.size[1]/2)-1)*100
			];
		if (obj.distance === false || (
				 (distance_to_center[0] <= obj.distance[1] && distance_to_center[1] <= obj.distance[1]) &&
				!(distance_to_center[0] <= obj.distance[0] && distance_to_center[1] <= obj.distance[0])
			)) {
			return true;
		}
		return false;
	}

	this._gen_update_limits = function () {
		for (var b = 0; b < this.c.buildings.types.length; b++) {
			this.count_objects["per_block_buildings."+this.c.buildings.types[b].type] = 0;
		}
		for (var b = 0; b < this.c.decorations.types.length; b++) {
			this.count_objects["per_block_decorations."+this.c.decorations.types[b].type] = 0;
		}
	}
	
	this._gen_check_limit = function (type, obj) {
		if (typeof this.count_objects[type+"."+obj.type] == 'undefined') this.count_objects[type+"."+obj.type] = 0;
		this.count_objects[type+"."+obj.type]++;
		this.count_objects["per_block_"+type+"."+obj.type]++;
		if (this.c.limits.types[type+"."+obj.type].max > -1 && this.count_objects[type+"."+obj.type] > this.c.limits.types[type+"."+obj.type].max) return false;
		if (this.c.limits.types[type+"."+obj.type].max_per_block > -1 && this.count_objects["per_block_"+type+"."+obj.type] > this.c.limits.types[type+"."+obj.type].max_per_block) return false;
		return true;
	}
	
	this._gen_set_object = function (type, pos, obj, force_id) {
		if (force_id > 0) {
			this.id = force_id;
		} else {
			this.id++;
		}
		this.last_object.pos = pos;
		this.last_object.obj = obj,
		this.last_object.type = type;
		this.last_object.id = parseInt(this.id);
		for (var y = pos[1]; y < pos[1]+obj.size[1]; y++) {
			for (var x = pos[0]; x < pos[0]+obj.size[0]; x++) {
				if (typeof obj.object_map == 'undefined' || obj.object_map === false || obj.object_map[y-pos[1]][x-pos[0]] == 1) {
					this.m[y][x].id = this.id;
					this.m[y][x].type = type;
					this.m[y][x].sub_type = obj.type;
					if (typeof obj.walkable_map == 'object') {
						this.w[y][x] = obj.walkable_map[y-pos[1]][x-pos[0]];
					} else {
						this.w[y][x] = 0;	// TODO chech walkable map
					}
				}
			}
		}
	}
	
	this._gen_buildings_blocks_check_collision = function (pos, building, fit, position) {
		var fitted = true;
		var delta = 0;
		var deltas = { 
			"any": this.c.buildings.space_between_items,
			"road" : this.c.buildings.space_to_road,
		}

		if (
			pos[0] >= 0 && pos[1] >= 0 && 
			pos[0]+building.size[0] <= this.c.size[0] && pos[1]+building.size[1] <= this.c.size[1] &&
			(building.position.indexOf('contour')>-1 || building.position.indexOf(position)>-1) &&
			this._gen_check_distance(pos, building) &&  
			fitted
		) {
			fitted = this._gen_check_collission("buildings", pos, { size: [building.size[0], building.size[1]] });
			// space between buildings
			for (var delta_type in deltas) {
				if (deltas[delta_type] != 'undefined') {
					delta = deltas[delta_type];
					if (fitted === true && delta > 0) {
						fitted = this._gen_check_border ("buildings", pos, building, delta, delta_type);
					}
				}
			}
			if (fitted === true && fit === true) {
				fitted = this._gen_check_limit("buildings", building);
				if (fitted === true) {
					this._gen_set_object("building", pos, building);
				}
			}
		} else {
			fitted = false;
		}
		return fitted;
	}

	this._gen_decorations_blocks_fit = function (b, obj) {
		var fitted = false;
		var l = 100;	// limit random process to `l` iterations
		var pos = [-1,-1];
		while (l>0) {
			if (obj.merge && this.last_object.obj != false && this.last_object.obj.type == obj.type) {
				rnd_x = Math.round(this.rnd(this.last_object.pos[0]-obj.size[0]*0.5, this.last_object.pos[0]+obj.size[0]*0.5));
				rnd_y = Math.round(this.rnd(this.last_object.pos[1]-obj.size[1]*0.5, this.last_object.pos[1]+obj.size[1]*0.5));
			} else {
				rnd_x = Math.round(this.rnd(b[0], b[2]-obj.size[0]));
				rnd_y = Math.round(this.rnd(b[1], b[3]-obj.size[1]));
			}
			pos = [rnd_x, rnd_y];
			if ( 
				this._gen_check_collission("decorations", pos, obj) && 
				this._gen_check_distance(pos, obj) &&
				this._gen_check_border("decorations", pos, obj, this.c.decorations.space_between_items, 'any') &&
				this._gen_check_limit ("decorations", obj)
			) {
				if (obj.merge && this.last_object.obj != false && this.last_object.obj.type == obj.type) {
					this._gen_set_object("decorations", pos, obj, this.last_object.id);
				} else {
					this._gen_set_object("decorations", pos, obj);
				}
				fitted = true;
				l=-1;
			}
			l--;
		}
		return fitted;		
	}

	this._gen_buildings_blocks_fit = function (b, building, step) {
		var fitted = false;
		var delta_road = Math.round(this.c.buildings.space_to_road);
				
		// set corners
		if (step == 'corners') {
			var tmp = this.shuffle(['topleft', 'topright', 'bottomleft', 'bottomright']);
			for (var i = 0; i < 4; i++) {
				if (Math.random()>0.5 && tmp[i] == 'topleft') this._gen_buildings_blocks_check_collision([b[0]+delta_road, b[1]+delta_road], building, true, 'topleft');
				if (Math.random()>0.5 && tmp[i] == 'topright') this._gen_buildings_blocks_check_collision([b[0]+delta_road, b[3]-building.size[1]-delta_road+1], building, true, 'topright');
				if (Math.random()>0.5 && tmp[i] == 'bottomleft') this._gen_buildings_blocks_check_collision([b[2]-delta_road-building.size[0]+1, b[1]+delta_road], building, true, 'bottomleft');
				if (Math.random()>0.5 && tmp[i] == 'bottomright') this._gen_buildings_blocks_check_collision([b[2]-delta_road-building.size[0]+1, b[3]-building.size[1]-delta_road+1], building, true, 'bottomright');
			}
		} else {
			
			// set by contour
			if (building.random_position) {
				var random_process = true;
				var rnd_x = 0;
				var rnd_y = 0;
				var l = 1000;	// limit random process to `l` iterations
				if (building.position.indexOf('anywhere') > -1 && step == 'anywhere') {
					while (l>0) {
						rnd_x = Math.round(this.rnd(b[0]+delta_road, b[2]-building.size[0]-delta_road));
						rnd_y = Math.round(this.rnd(b[1]+delta_road, b[3]-building.size[1]-delta_road));
						if ( this._gen_buildings_blocks_check_collision([rnd_x, rnd_y], building, true, 'anywhere') ) {
							fitted = true;
						}
						l--;
					}
				} else {
					var result = false;
					while (random_process && l>0) {
						rnd_x = Math.round(this.rnd(b[0]+delta_road, b[2]-building.size[0]-delta_road));
						rnd_y = Math.round(this.rnd(b[1]+delta_road, b[3]-building.size[1]-delta_road));
						result = [
								this._gen_buildings_blocks_check_collision([rnd_x, b[1]+delta_road], building, true, 'top'), 
								this._gen_buildings_blocks_check_collision([rnd_x, b[3]-building.size[1]-delta_road+1], building, true, 'bottom'), 
								this._gen_buildings_blocks_check_collision([b[0]+delta_road, rnd_y], building, true, 'left'),  
								this._gen_buildings_blocks_check_collision([b[2]-building.size[0]-delta_road+1, rnd_y], building, true, 'right')
							];
						if ( result[0] || result[1] || result[2] || result[3] ) {
							fitted = true;
						} else {
							random_process = false;
						}
						l--;
					}
				}
				
			} else {
				for (var x = b[0]+delta_road; x < b[2]-building.size[0]-delta_road; x++) {
					if (
						this._gen_buildings_blocks_check_collision([x, b[1]+delta_road], building, true, 'top') || 
						this._gen_buildings_blocks_check_collision([x, b[3]-building.size[1]-delta_road+1], building, true, 'bottom')
					) {
						fitted = true;
					}
				}
				for (var y = b[1]+delta_road; y < b[3]-building.size[1]-delta_road; y++) {
					if (
						this._gen_buildings_blocks_check_collision([b[0]+delta_road, y], building, true, 'left') || 
						this._gen_buildings_blocks_check_collision([b[2]-building.size[0]-delta_road+1, y], building, true, 'right')
					) {
						fitted = true;
					}
				}
			}
		}
		
		return fitted;
	}
	this.gen_buildings_blocks = function (i) {
		if (typeof i == 'undefined') {
			for (var i = 0; i < this.blocks.length; i++) {
				this.gen_buildings_blocks(i);
			}
		} else {
			this._gen_update_limits();
			
			// set corners at first
			var b_limit = 0;
			for (var b = 0; b < this.c.buildings.types.length; b++) {
				b_limit = 100;
				if (
					this.c.buildings.types[b].position.indexOf('topleft') > -1 || 
					this.c.buildings.types[b].position.indexOf('topright') > -1 || 
					this.c.buildings.types[b].position.indexOf('bottomleft') > -1 || 
					this.c.buildings.types[b].position.indexOf('bottomright') > -1
				) {
					while (b_limit > 0 && this._gen_buildings_blocks_fit(this.blocks[i], this.c.buildings.types[b], 'corners')) { b_limit--; }
				}
			}
			
			// set contour
			for (var b = 0; b < this.c.buildings.types.length; b++) {
				b_limit = 1000;
				if (
					this.c.buildings.types[b].position.indexOf('left') > -1 || 
					this.c.buildings.types[b].position.indexOf('right') > -1 || 
					this.c.buildings.types[b].position.indexOf('top') > -1 || 
					this.c.buildings.types[b].position.indexOf('bottom') > -1 || 
					this.c.buildings.types[b].position.indexOf('contour') > -1 
				) {
					while (b_limit > 0 && this._gen_buildings_blocks_fit(this.blocks[i], this.c.buildings.types[b], 'contour')) { 
						b_limit--; 
					}
				}
			}
			
			// special object (decorations) inside block
			for (var b = 0; b < this.c.decorations.types.length; b++) {
				b_limit = 1000;
				this.last_object = { 
						id: 0,
						pos: [-1,-1],
						obj: false 
					};

				if (Math.random() > 1-this.c.decorations.types[b].value) {
					while (b_limit > 0 && this._gen_decorations_blocks_fit(this.blocks[i], this.c.decorations.types[b])) { 
						b_limit--; 
					}
				}
			}
			
			// set anywhere
			for (var b = 0; b < this.c.buildings.types.length; b++) {
				b_limit = 1000;
				if (
					this.c.buildings.types[b].position.indexOf('anywhere') > -1
				) {
					while (b_limit>0 && this._gen_buildings_blocks_fit(this.blocks[i], this.c.buildings.types[b], 'anywhere')) { b_limit--; }
				}
			}

		}
	}
	
	
	this.gen_finish = function () {
		for (var y=0;y<this.c.size[1];y++) {
			for (var x=0;x<this.c.size[0];x++) {
				if (this.m[y][x].type == 'none') {
					this.m[y][x].type = 'ground';
					this.w[y][x] = 1;
				}
			}
		}
	}
	
	// help functions
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
