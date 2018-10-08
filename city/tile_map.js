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
						'house_medium.rotated': "#aa0000",
						'house_medium.corner': "#aa0000",
						'house_small': "#770000",
						'house_small.corner': "#770000",
						'house_small.random': "#770000",
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
			},
			decorations: {
				html: "*",
				color: "blue"
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
				//out+='<div title="'+sub_type+'" style="background-color: '+color+'; '+(walk[y][x]>0.5?'border-top: 1px dotted green; border-left: 1px dotted green; ':'margin-top:1px; margin-left:1px; ')+'display: inline-block; width:15px; height:15px; font-size: 10px;">'+(map[y][x].id==0?"&nbsp;":map[y][x].id)+'</div>';
				out+='<div title="'+map[y][x].type+'.'+sub_type+' w'+walk[y][x]+'" style="background-color: '+color+'; display: inline-block; width:15px; height:15px; font-size: 10px;">'+(map[y][x].id==0?"&nbsp;":map[y][x].id)+'</div>';
			}
			out+="</div>";
		}
		this.obj.innerHTML = out;
	}
}
