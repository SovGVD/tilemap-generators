var tileMap = function (obj) {
	this.obj = obj;
	
	/*
	 *  0 ----> x
	 *  |
	 *  |
	 *  V
	 *  y
	 */
	
	this.tiles = {
			road: {
				html: "+",
				color: "gray"
			},
			ground: {
				html: "-",
				color: "green"
			},
			water: {
				html: "~",
				color: "blue"
			},
			sand: {
				html: "-",
				color: "yellow"
			},
			snow: {
				html: "*",
				color: "white"
			},
			rock: {
				html: "^",
				color: "gray"
			},
			none: {
				html: ".",
				color: "purple"
			},
			unknown : {
				html: "?",
				color: "yellow"
			},
		},
	
	this.display = function (obj) {
		var map = obj.map;
		var walk = obj.walk;
		var out = "";
		for (var y = 0; y < map.length; y++) {
			out +="<div style='white-space: nowrap;'>"
			for (var x = 0; x < map[y].length; x++) {
				var type = typeof map[y][x].type != 'undefined'?map[y][x].type:'unknown';
				var sub_type = map[y][x].sub_type;
				if (typeof this.tiles[type] == 'undefined') type = 'unknown';
				var color = this.tiles[type].color;
				if (typeof sub_type == 'undefined') {
					sub_type = '';
				} else if (typeof this.tiles[type].types_color != 'undefined' && typeof this.tiles[type].types_color[sub_type] != 'undefined') {
					color = this.tiles[type].types_color[sub_type];
				}
				out+='<div title="['+map[y][x].dbg+'] '+map[y][x].type+'.'+sub_type+' w'+walk[y][x]+'" style="background-color: '+color+'; display: inline-block; width:15px; height:15px; font-size: 10px;">&nbsp;</div>';
			}
			out+="</div>";
		}
		this.obj.innerHTML = out;
	}
}
