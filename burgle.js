"use strict";
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
    var floor = Array(17).join(1).split('').map(function(){return {heat:0}});
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

function valid(floor) {
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

function update_distance(a_ind, b_ind, dist) {
    var a = a_ind * 16;
    var b = b_ind * 16;
    for (var i=0; i<16; i++) {
        if (dist[a] < dist[b])
            dist[b] = dist[a] + 1;
        else if (dist[b] < dist[a])
            dist[a] = dist[b] + 1;
        a++;
        b++;
    }
}

function build_distance(floor) {
    var dist = Array(257).join(1).split('').map(function(){return 20});
    for (var i=0; i<16; i++) dist[i * 16 + i] = 0;
    for (var r=0; r<16; r++) {
        for (var i=0; i<16; i++) {
            if (floor[i].n) update_distance(i, i-4, dist);
            if (floor[i].e) update_distance(i, i+1, dist);
            if (floor[i].s) update_distance(i, i+4, dist);
            if (floor[i].w) update_distance(i, i-1, dist);
        }
    }
    return dist;
}

function find_clockwise(options, to) {
    for (var i=0; i<options.length; i++) {
        var dy=1, dx=1;
        var r = Math.atan2(dy, dx);
    }
    return options[0];
}

function walk(from ,to, floor, dist) {
    var min, shortest, tile;
    function look(dir, neighbor) { 
        var ind = neighbor * 16 + to;
        if (tile[dir]) {
            if (dist[ind] < min) {
                shortest = [neighbor];
                min = dist[ind];
            }
            else if (dist[ind] === min) {
                shortest.push(neighbor);
            }
        }
    }
    while (from !== to) {
        min = 20;
        tile = floor[from];
        look('n', from - 4);
        look('e', from + 1);
        look('s', from + 4);
        look('w', from - 1);
        var next = shortest.length > 1 ? find_clockwise(shortest) : shortest[0];
        floor[next].heat++;
        from = next;
    }
}

function heatmap(floor) {
    var dist = build_distance(floor);
    for (var i=0; i<16; i++) {
        for (var j=0; j<16; j++) {
            walk(i, j, floor, dist);
        }
    }
    var heat = [];
    for (var y=0; y<4; y++) {
        var r = [];
        for (var x=0; x<4; x++) {
            r.push(floor[y*4 + x].heat);
        }
        heat.push(r);
    }
    console.table(heat);
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
            var floor = toFloor(walls);
            if (!valid(floor)) continue;
            heatmap(floor);
            break;
        }
    }
}

}());
