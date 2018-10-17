var city = function (c) {
	this.c = c;
	this.m = false;	// map
	this.w = false;	// walkable
	
	this.init = function () {
		this.m = []; this.w = [];


		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = []; this.w[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				this.m[y][x] = { type: "none", id: 0 };
				this.w[y][x] = 1;
			}
		}
		this.gen_plan();
	}
	
	this.get = function () {
		return {map: this.m, walk: this.w };
	}


	// Generate building units placeholders
	this.gen_plan = function () {
		
	}
	
	// help functions
	this.rnd = function (min, max) {
		return parseInt((Math.random()*(max-min+1)+min));
	}
		
	this.init(c);
}
