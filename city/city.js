var city = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	this.gen = false;
	this.blocks = [];
	this.id = false;
	this.count_buildings = {};
	
	this.init = function () {
		this.m = []; this.w = [];
		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				if (x==0 || y==0 || x==this.c.size[0]-1 || y==this.c.size[1]-1) {
					this.m[y][x] = { type: "border", id: 1 };
					this.w[y][x] = 0;
				} else {
					this.m[y][x] = { type: "none", id: 0 };
					this.w[y][x] = 0;
				}
			}
		}
		if (this.c.f.type == 'lsystem') {
			this.gen_road_lsystem(true, [1 ,1 , parseInt(this.c.size[0])-2, parseInt(this.c.size[1])-2, 2]);
		}
		this.id = this.gen_buildings_blocks_clear();
		this.gen_buildings_blocks();		
	}
	
	this.get = function () {
		return this.m;
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
				// add it to the list randomly
				if (Math.random()>0.5) {
					tmp.push(this.blocks[i]);
				} else {
					tmp.unshift(this.blocks[i]);
				}
				if (max_id < this.blocks[i][4]) max_id=this.blocks[i][4];
			}
		}
		this.blocks = tmp;

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
	
	this._gen_buildings_blocks_check_collision = function (pos, building, fit) {
		var fitted = true;
		var delta = this.c.buildings.space_between_buildings;
		//console.log("check", pos[0], pos[1], building);
		if (pos[0] >= 0 && pos[1] >= 0 && pos[0]+building.size[0] <= this.c.size[0] && pos[1]+building.size[1] <= this.c.size[1]) {
			for (var y = pos[1]; y < pos[1]+building.size[1]; y++) {
				for (var x = pos[0]; x < pos[0]+building.size[0]; x++) {
					if (this.m[y][x].id > 0) {
						fitted = false;
						break;
					}
				}
				if (!fitted) break;
			}
			// space between buildings
			if (fitted === true && delta > 0) {
				for (var y = pos[1]-delta; y < pos[1]+building.size[1]+delta; y++) {
					if ((pos[0]-delta >= 0 && this.m[y][pos[0]-delta].type  == 'building') || (pos[0]+building.size[0]+delta-1 < this.c.size[0] && this.m[y][pos[0]+building.size[0]+delta-1].type  == 'building')) {
						fitted = false;
						break;
					}
				}
				for (var x = pos[0]-delta; x < pos[0]+building.size[0]+delta; x++) {
					if ((pos[1]-delta >= 0 && this.m[pos[1]-delta][x].type  == 'building') || (pos[1]+building.size[1]+delta-1 < this.c.size[1] && this.m[pos[1]+building.size[1]+delta-1][x].type  == 'building')) {
						fitted = false;
						break;
					}
				}
			}
			if (fitted === true && fit === true) {
				this.id++;
				if (typeof this.count_buildings[building.type] == 'undefined') this.count_buildings[building.type] = 0;
				this.count_buildings[building.type]++;
				if (this.c.buildings.limits.types[building.type].max > 0 && this.count_buildings[building.type] > this.c.buildings.limits.types[building.type].max) fitted = false;
				if (fitted === true) {
					//console.log("setup building", pos[0], pos[1], building);
					for (var y = pos[1]; y < pos[1]+building.size[1]; y++) {
						for (var x = pos[0]; x < pos[0]+building.size[0]; x++) {
							this.m[y][x].id = this.id;
							this.m[y][x].type = "building";
							this.m[y][x].sub_type = building.type;
							this.w[y][x] = 0;
						}
					}
				}
			}
		} else {
			fitted = false;
		}
		return fitted;
	}

	this._gen_buildings_blocks_fit = function (b, building) {
		//console.log("try to fit", building, "into", b);
		var fitted = false;
		
		// set into corners
		this._gen_buildings_blocks_check_collision([b[0], b[1]], building, true);
		this._gen_buildings_blocks_check_collision([b[0], b[3]-building.size[1]+1], building, true);
		this._gen_buildings_blocks_check_collision([b[2]-building.size[0]+1, b[1]], building, true);
		this._gen_buildings_blocks_check_collision([b[2]-building.size[0]+1, b[3]-building.size[1]+1], building, true);
		
		// set around the corners
		for (var x = b[0]; x < b[2]-building.size[0]; x++) {
			if (this._gen_buildings_blocks_check_collision([x, b[1]], building, true) || this._gen_buildings_blocks_check_collision([x, b[3]-building.size[1]+1], building, true)) {
				fitted = true;
			}
		}
		for (var y = b[1]; y < b[3]-building.size[1]; y++) {
			if (this._gen_buildings_blocks_check_collision([b[0], y], building, true) || this._gen_buildings_blocks_check_collision([b[2]-building.size[0]+1, y], building, true)) {
				fitted = true;
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
			for (var b = 0; b < this.c.buildings.types.length; b++) {
				while (this._gen_buildings_blocks_fit(this.blocks[i], this.c.buildings.types[b])) {
					
				}
			}
		}
	}
	
	// help functions
	this.rnd = function (min, max) {
		return parseInt((Math.random()*(max-min+1)+min));
	}
	
	this.init(c);
}
