"use strict";

var heatmap = false,
    floors  = 3,
    size    = 4,
    size_sq = 16,
    walls   = 8,
    pillar;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function as_walls(layout) {
    var walls = [];
    var w = size * (size - 1) * 2;
    for (var i = 0; i < w; i++) {
        if ((1 << i) & layout) {
            walls[i] = true;
        }
    }
    return walls;
}

function to_floor(walls) {
    var i = 0, x = 0;
    var floor = new Array(size_sq + 1).join(1).split('').map(function () {
        return {heat: 0}
    });
    for (var y = 0; y < size; y++) {
        for (x = 0; x < size - 1; x++) {
            if (!walls[i]) {
                floor[y * size + x].e = true;
                floor[y * size + x + 1].w = true;
            }
            i++;
        }
        if (y < size - 1) {
            for (x = 0; x < size; x++) {
                if (!walls[i]) {
                    floor[y * size + x].s = true;
                    floor[(y + 1) * size + x].n = true;
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
        if (tile.v)
            continue;
        visited++;
        tile.v = true;
        if (tile.n)
            check.push(next - size);
        if (tile.e)
            check.push(next + 1);
        if (tile.s)
            check.push(next + size);
        if (tile.w)
            check.push(next - 1);
    }
    return visited === size_sq;
}

function update_distance(a_ind, b_ind, dist) {
    var a = a_ind * size_sq;
    var b = b_ind * size_sq;
    for (var i = 0; i < size_sq; i++) {
        if (dist[a] < dist[b])
            dist[b] = dist[a] + 1;
        else if (dist[b] < dist[a])
            dist[a] = dist[b] + 1;
        a++;
        b++;
    }
}

function build_distance(floor) {
    var i, dist = new Array(size_sq * size_sq + 1).join(1).split('').map(function () {
        return 50
    });
    for (i = 0; i < size_sq; i++)
        dist[i * size_sq + i] = 0;
    for (var r = 0; r < size_sq; r++) {
        for (i = 0; i < size_sq; i++) {
            if (floor[i].n)
                update_distance(i, i - size, dist);
            if (floor[i].e)
                update_distance(i, i + 1, dist);
            if (floor[i].s)
                update_distance(i, i + size, dist);
            if (floor[i].w)
                update_distance(i, i - 1, dist);
        }
    }
    return dist;
}

//from: index of tile
//to: index of tile
//options: array of [radians, neighbor's index]
function find_clockwise(from, to, options) {
    var dy = Math.floor(to / size) - Math.floor(from / size);
    var dx = to % size - from % size;
    var target = Math.atan2(dy, dx);
    var min = 7;
    var dir;
    for (var i = 0; i < options.length; i++) {
        var o = options[i];
        var r = o[0] - target;
        if (r < 0)
            r += 2 * Math.PI;
        if (r < min) {
            min = r;
            dir = o[1];
        }
    }
    return dir;
}

function walk(from, to, floor, dist) {
    var min, shortest=[], tile;

    function look(dir, neighbor, r) {
        var ind = neighbor * size_sq + to;
        if (tile[dir]) {
            if (dist[ind] < min) {
                shortest = [[r, neighbor]];
                min = dist[ind];
            }
            else if (dist[ind] === min) {
                shortest.push([r, neighbor]);
            }
        }
    }

    while (from !== to) {
        min = 50;
        tile = floor[from];
        look('n', from - size, Math.PI * -.5);
        look('e', from + 1, 0);
        look('s', from + size, Math.PI * .5);
        look('w', from - 1, Math.PI);
        var next = shortest.length > 1 ? find_clockwise(from, to, shortest) : shortest[0][1];
        floor[next].heat++;
        from = next;
    }
}

function generate_heatmap(id, floor) {
    var i, j, heat = [];
    if (!heatmap) {
        for (i = 0; i < size_sq; i++) {
            document.getElementById(id + '_t' + i).style.backgroundColor = '';
        }
        return;
    }

    var dist = build_distance(floor);
    for (i = 0; i < size_sq; i++) {
        for (j = 0; j < size_sq; j++) {
            walk(i, j, floor, dist);
        }
    }
    for (i = 0; i < size_sq; i++) {
        heat = (1.0 - (floor[i].heat - (size_sq - 1)) / 168) * 240;
        document.getElementById(id + '_t' + i).style.backgroundColor = 'hsl(' + heat + ',100%,50%)';
    }
    heat = [];
    for (var y = 0; y < size; y++) {
        var r = [];
        for (var x = 0; x < size; x++) {
            r.push(floor[y * size + x].heat);
        }
        heat.push(r);
    }
    var total_heat = 0;
    for ( i = 0; i < size_sq; i++) {
        total_heat += floor[i].heat;
    }
}

function set_layout(id, layout, walls) {
    if (walls === undefined)
        walls = as_walls(layout);
    var floor = to_floor(walls);
    if (!valid(floor))
        return false;
    var f = document.getElementById(id);
    f.setAttribute('layout', layout.toString(16));
    for (var w = 0; w < size * (size - 1) * 2; w++) {
        document.getElementById(id + '_' + w).className = walls[w] ? 'wall' : '';
    }
    generate_heatmap(id, floor);
    return true;
}

function init() {
    var j = getParameterByName('job');
    if (j !== "") document.getElementById('job').options[j].selected = true;
    if (getParameterByName('heat') !== "") {
        heatmap = true;
        var heat = document.getElementById('burgle_heat');
        if (heat !== null) heat.checked = heatmap;
    }
    new_job();
}

function update_dom() {
	var floorElem = document.getElementById("floors");
	while (floorElem.lastChild) {
		floorElem.removeChild(floorElem.lastChild);
	}

    var cols = size * 2 - 1;
    for (var f = 0; f < floors; f++) {
		var id = 'f' + f;
		var container = document.createElement('div');
		container.setAttribute('class', 'floorContainer');

        var floor = document.createElement('div');
		floor.setAttribute('class', 'floor');
		floor.setAttribute('id', id);
        var table = document.createElement('table');
        var wall = 0;
        for (var i = 0; i < cols; i++) {
            var row = document.createElement('tr');
            for (var j = 0; j < cols; j++) {
                var td = document.createElement('td');
                if (i % 2 === 0 && j % 2 === 0) {
                    td.className = 'tile';
                    td.setAttribute('id', id + '_t' + (i * 2 + (j / 2)));
                }
                if (i % 2 === 0 ? j % 2 != 0 : j % 2 === 0)
                    td.setAttribute('id', id + '_' + wall++);
                row.appendChild(td);
            }
            table.appendChild(row);
        }
        floor.appendChild(table);

		var btn = document.createElement('button');
		btn.setAttribute('class', 'center');
		btn.setAttribute('onClick', "generate('f" + f + "')");
		btn.appendChild(document.createTextNode("Generate " + (f + 1) + ". Floor"));

		container.appendChild(floor);
		container.appendChild(btn);
		floorElem.appendChild(container);

        var layout = parseInt(getParameterByName(id), size_sq);
        if (layout > 0 && set_layout(id, layout))
            floor.setAttribute('layout', layout.toString(size_sq));
    }
    update_href();
}

function update_href() {
    var link = window.location.protocol + '//';
    link += window.location.hostname;
    if (window.location.port)
        link += ':' + window.location.port;
    link += window.location.pathname + '?job=';
    link += document.getElementById('job').selectedIndex;
    if (heatmap)
        link += 'heat=on&';

    var layouts = [];
    var floors = document.getElementsByClassName("floor");
    for (var f = 0; f < floors.length; f++) {
        layouts.push(floors[f].getAttribute('id') + '=' + floors[f].getAttribute('layout'));
    }
    document.getElementById('burgle_href').href = link + layouts.join('&');
}

function generate(id, size) {
    var floors;
    if (id === undefined || id === 'all')
        floors = document.getElementsByClassName("floor");
    else
        floors = [document.getElementById(id)];
    for (var f = 0; f < floors.length; f++) {
        while (true) {
            var walls = [];
            var layout = 0;
            for (var w = 0; w < walls;) {
                var n = Math.floor(Math.random() * 24);
                if (!walls[n]) {
                    w++;
                    walls[n] = true;
                    layout |= 1 << n;
                }
            }
            if (set_layout(floors[f].getAttribute('id'), layout, walls)) {
                break;
            }
        }
    }
    update_href();
}

function new_job() {
  var j = document.getElementById('job');
  var info = j.options[j.selectedIndex].value.split(":");
  floors = parseInt(info[0]);
  size = parseInt(info[1]);
  size_sq = size * size;
  walls = parseInt(info[2]);
  update_dom();
}

function show_heat(show) {
    heatmap = show;
    if (heatmap) {
        document.getElementById('show_heatmap').setAttribute('class', 'hidden');
        document.getElementById('hide_heatmap').removeAttribute('class');
    } else {
        document.getElementById('hide_heatmap').setAttribute('class', 'hidden');
        document.getElementById('show_heatmap').removeAttribute('class');
    }
    var floors = document.getElementsByClassName("floor");
    for (var f = 0; f < floors.length; f++) {
        var layout = floors[f].getAttribute('layout');
        if (layout !== null) {
            set_layout(floors[f].getAttribute('id'), parseInt(layout, 16));
        }
    }
    update_href();
}

if (window.addEventListener)
    window.addEventListener('load', update_dom, false);
else
    window.attachEvent('onload', update_dom); //IE
