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
			default: {
				html: ".",
				color: "#eee"
			}
		},
	
	this.display = function (map) {
		//console.log("map", map);
		var out = "";
		for (var y = 0; y < map.length; y++) {
			out +="<div style='white-space: nowrap;'>"
			for (var x = 0; x < map[y].length; x++) {
				var type = map[y][x].type;
				if (!this.tiles[type]) type = 'default';
				//out+=this.tiles[type].html;
				out+='<div style="background-color: '+this.tiles[type].color+'; display: inline-block; width:15px; height:15px; font-size: 10px;">'+(map[y][x].id==0?"&nbsp;":map[y][x].id)+'</div>';
			}
			out+="</div>";
		}
		this.obj.innerHTML = out;
	}
}
