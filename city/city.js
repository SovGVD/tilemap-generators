var city = function (c) {
	this.c = c;
	this.m = false;
	this.gen = false;
	
	this.init = function () {
		this.m = [];
		for (var y=0;y<this.c.size[1];y++) {
			this.m[y] = [];
			for (var x=0;x<this.c.size[0];x++) {
				this.m[y][x] = { type: "default", id: 0 };
			}
		}
		if (this.c.f.type == 'lsystem') {
			this.gen_lsystem(true, 0 ,0 , parseInt(this.c.size[0]), parseInt(this.c.size[1]), 1);
		}
	}
	
	this.get = function () {
		return this.m;
	}
	
	// L-system
	// https://gamedev.stackexchange.com/questions/86234/using-l-systems-to-procedurally-generate-cities
	this.gen_lsystem_config = {
			max_iterations: 20,
			random_road_length: true,
		};
	this.gen_lsystem = function (flag, x0, y0, x1, y1, id) {
		/*
			  o---> (x w)
			  |
			  |
			  v
			(y h)
		*/
		// TODO random roads shoud be connected to something else? but not on first iteration
		// TODO road width
		var w = x1-x0;
		var h = y1-y0;
		var d = (flag?this.rnd(x0+w/4,x1-w/4):this.rnd(y0+h/4,y1+w/4));	// flag - vertical (by X axis)
		
		var w1 = (flag?(d-1):x1) - x0;
		var w2 = x1 - (flag?d:x0);
		var h1 = (flag?y1:(d-1)) - y0;
		var h2 = y1 - (flag?y0:d);

		if ( 
			((w1 >= this.c.houses.max[0] && h1 >= this.c.houses.max[1]) || (w1 >= this.c.houses.max[1] && h1 >= this.c.houses.max[0])) && 
			((w2 >= this.c.houses.max[0] && h2 >= this.c.houses.max[1]) || (w2 >= this.c.houses.max[1] && h2 >= this.c.houses.max[0]))
			) {
			//console.log("space ", w1, "x", h1, "or", w2, "x", h2);
		} else {
			//console.log("stop");
			if (id<=2) {
				this.gen_lsystem (flag, x0, y0, x1, y1, id);
			}
			return false;
		}


		var rl = flag?h:w;	// road length
		var ro = flag?(y0):(x0);	// road offset
		var rw = 1;	// road width
		if (this.gen_lsystem_config.random_road_length) {
			//rl = this.rnd(rl/1.5,rl);
			//ro = parseInt(rl/parseInt(Math.random()*10));
		}
		for (var i=ro;i<=(ro+rl);i++) {
			if (typeof this.m[flag?i:d] != 'undefined' && typeof this.m[flag?i:d][flag?d:i] != 'undefined') {
				this.m[flag?i:d][flag?d:i].type = "road";
				this.m[flag?i:d][flag?d:i].id = id;
			}
		}
		//this.gen_lsystem_config.max_iterations--;
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
			id++;
			this.gen_lsystem(!flag, x0, y0, flag?(d-1):x1, flag?y1:(d-1), id);
			this.gen_lsystem(!flag, flag?d:x0, flag?y0:d, x1, y1, id);
		}
	}
	
	// help functions
	this.rnd = function (min, max) {
		return parseInt((Math.random()*(max-min+1)+min));
	}
	
	this.init(c);
}
