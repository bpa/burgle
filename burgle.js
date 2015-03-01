var Burgle = (function() {

function initFloors() {
  var floors = document.getElementsByClassName("floor");
  for (var f=0; f<floors.length; f++) {
	var floor = floors[f];
	var id = floor.getAttribute('id');
	if (id === null) {
		id = 'floor' + f;
        while(document.getElementById(id) !== null) {
            id = id + '0';
        }
		floor.setAttribute('id', id);
	}
	var table = document.createElement('table');
    var wall = 0;
	for (var i=0; i<7; i++) {
		var row = document.createElement('tr');
		for (var j=0; j<7; j++) {
			var td = document.createElement('td');
			if(i%2==0 && j%2==0) td.className = 'tile';
			if(i%2==0 ? j%2!=0 : j%2==0) td.setAttribute('id', id + '_' + wall++);
			row.appendChild(td);
		}
		table.appendChild(row);
	}
	floor.appendChild(table);
  }
}

if(window.addEventListener) window.addEventListener('load',initFloors,false);
else window.attachEvent('onload',initFloors); //IE

function toFloor(walls) {
    var i = 0;
    var floor = Array(17).join(1).split('').map(function(){return {}});
    for (var y=0; y<4; y++) {
        for (var x=0; x<3; x++) {
           if (!walls[i]) {
              floor[y * 4 + x].e = true;
              floor[y * 4 + x + 1].w = true;
           }
           i++;
        }
        if (y<3) {
            for (var x=0; x<4; x++) {
               if (!walls[i]) {
                  floor[y * 4 + x].s = true;
                  floor[(y+1) * 4 + x].n = true;
               }
               i++;
            }
        }
    }
    return floor;
}

function valid(walls) {
    var floor = toFloor(walls);
    var check = [0];
    var visited = 0;
    while (check.length > 0) {
        var next = check.pop();
        var tile = floor[next];
        if (tile.v) continue;
        visited++;
        tile.v = true;
        if (tile.n) check.push(next - 4);
        if (tile.e) check.push(next + 1);
        if (tile.s) check.push(next + 4);
        if (tile.w) check.push(next - 1);
    }
    return visited === 16;
}

return function(id) {
	var floors;
	if (id === undefined || id === 'all')
  		floors = document.getElementsByClassName("floor");
	else
		floors = [document.getElementById(id)];
    for (var f=0; f<floors.length; f++) {
        while (true) {
            var walls = [];
            for (var w=0; w<8;) {
                var n=Math.floor(Math.random() * 24);
                if (!walls[n]) {
                    w++;
                    walls[n] = true;
                }
            }
            var id = floors[f].getAttribute('id');
            for (var w=0; w<24; w++) {
                document.getElementById(id + '_' + w).className = walls[w] ? 'wall' : '';
            }
            if (!valid(walls)) continue;
            break;
        }
    }
}

}());
