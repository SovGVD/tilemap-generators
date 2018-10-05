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
			building: {
				html: "*",
				color: "red",
				types_color: {
						'house_one': "#ff5555",
						'house_big': "#dd0000",
						'house_big.rotated': "#dd0000",
						'house_medium': "#aa0000",
						'house_small': "#770000",
					}
			},
			ground: {
				html: "-",
				color: "green"
			},
			none: {
				html: ".",
				color: "#eee"
			},
			border: {
				html: ".",
				color: "black"
			}
		},
	
	this.display = function (map) {
		//console.log("map", map);
		var out = "";
		for (var y = 0; y < map.length; y++) {
			out +="<div style='white-space: nowrap;'>"
			for (var x = 0; x < map[y].length; x++) {
				var type = map[y][x].type;
				var sub_type = map[y][x].sub_type;
				var color = this.tiles[type].color;
				if (typeof this.tiles[type] == 'undefined') type = 'none';
				if (typeof sub_type == 'undefined') {
					sub_type = '';
				} else if (typeof this.tiles[type].types_color != 'undefined' && typeof this.tiles[type].types_color[sub_type] != 'undefined') {
					color = this.tiles[type].types_color[sub_type];
				}
				//out+=this.tiles[type].html;
				//out+='<div title="'+sub_type+'" style="background-color: '+color+'; border-top: 1px dotted blue; border-left: 1px dotted blue; display: inline-block; width:15px; height:15px; font-size: 10px;">'+(map[y][x].id==0?"&nbsp;":map[y][x].id)+'</div>';
				out+='<div title="'+sub_type+'" style="background-color: '+color+'; display: inline-block; width:15px; height:15px; font-size: 10px;">'+(map[y][x].id==0?"&nbsp;":map[y][x].id)+'</div>';
			}
			out+="</div>";
		}
		this.obj.innerHTML = out;
	}
}
