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
			none: {
				html: ".",
				color: "#eee"
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
				if (typeof this.tiles[type] == 'undefined') type = 'unknown';
				var color = this.tiles[type].color;
				out+='<div title="'+map[y][x].type+'.'+sub_type+' w'+walk[y][x]+'" style="background-color: '+color+'; display: inline-block; width:15px; height:15px; font-size: 10px;">&nbsp;</div>';
			}
			out+="</div>";
		}
		this.obj.innerHTML = out;
	}
}
