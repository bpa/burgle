"use strict";
var Burgle = (function () {
    var show_heat = false;

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function to_floor(walls) {
        var i = 0;
        var floor = Array(17).join(1).split('').map(function () {
            return {heat: 0}
        });
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 3; x++) {
                if (!walls[i]) {
                    floor[y * 4 + x].e = true;
                    floor[y * 4 + x + 1].w = true;
                }
                i++;
            }
            if (y < 3) {
                for (var x = 0; x < 4; x++) {
                    if (!walls[i]) {
                        floor[y * 4 + x].s = true;
                        floor[(y + 1) * 4 + x].n = true;
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
                check.push(next - 4);
            if (tile.e)
                check.push(next + 1);
            if (tile.s)
                check.push(next + 4);
            if (tile.w)
                check.push(next - 1);
        }
        return visited === 16;
    }

    function update_distance(a_ind, b_ind, dist) {
        var a = a_ind * 16;
        var b = b_ind * 16;
        for (var i = 0; i < 16; i++) {
            if (dist[a] < dist[b])
                dist[b] = dist[a] + 1;
            else if (dist[b] < dist[a])
                dist[a] = dist[b] + 1;
            a++;
            b++;
        }
    }

    function build_distance(floor) {
        var dist = Array(257).join(1).split('').map(function () {
            return 20
        });
        for (var i = 0; i < 16; i++)
            dist[i * 16 + i] = 0;
        for (var r = 0; r < 16; r++) {
            for (var i = 0; i < 16; i++) {
                if (floor[i].n)
                    update_distance(i, i - 4, dist);
                if (floor[i].e)
                    update_distance(i, i + 1, dist);
                if (floor[i].s)
                    update_distance(i, i + 4, dist);
                if (floor[i].w)
                    update_distance(i, i - 1, dist);
            }
        }
        return dist;
    }

    function find_clockwise(from, to, options) {
        var dy = Math.floor(to / 4) - Math.floor(from / 4);
        var dx = to % 4 - from % 4;
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
        var min, shortest, tile;
        function look(dir, neighbor, r) {
            var ind = neighbor * 16 + to;
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
            min = 20;
            tile = floor[from];
            look('n', from - 4, Math.PI * -.5);
            look('e', from + 1, 0);
            look('s', from + 4, Math.PI * .5);
            look('w', from - 1, Math.PI);
            var next = shortest.length > 1 ? find_clockwise(from, to, shortest) : shortest[0][1];
            floor[next].heat++;
            from = next;
        }
    }

    function heatmap(id, floor) {
        if (!show_heat) {
            for (var i = 0; i < 16; i++) {
                document.getElementById(id + '_t' + i).style.backgroundColor = '';
            }
            return;
        }

        var dist = build_distance(floor);
        for (var i = 0; i < 16; i++) {
            for (var j = 0; j < 16; j++) {
                walk(i, j, floor, dist);
            }
        }
        for (var i = 0; i < 16; i++) {
            var heat = (1.0 - (floor[i].heat - 15) / 168) * 240;
            document.getElementById(id + '_t' + i).style.backgroundColor = 'hsl(' + heat + ',100%,50%)';
        }
        var heat = [];
        for (var y = 0; y < 4; y++) {
            var r = [];
            for (var x = 0; x < 4; x++) {
                r.push(floor[y * 4 + x].heat);
            }
            heat.push(r);
        }
        console.table(heat);
        var total_heat = 0;
        for (var i = 0; i < 16; i++) {
            total_heat += floor[i].heat;
        }
        console.log(total_heat);
    }

    function as_walls(layout) {
        var walls = [];
        for (var i = 0; i < 24; i++) {
            if ((1 << i) & layout) {
                walls[i] = true;
            }
        }
        return walls;
    }

    function set_layout(id, layout, walls) {
        if (walls === undefined)
            walls = as_walls(layout);
        var floor = to_floor(walls);
        if (!valid(floor))
            return false;
        var f = document.getElementById(id);
        f.setAttribute('layout', layout.toString(16));
        for (var w = 0; w < 24; w++) {
            document.getElementById(id + '_' + w).className = walls[w] ? 'wall' : '';
        }
        heatmap(id, floor);
        return true;
    }

    function init_floors() {
        if (getParameterByName('heat') !== "") {
            show_heat = true;
            var heat = document.getElementById('burgle_heat');
            if (heat !== null) heat.checked = show_heat;
        }
        var floors = document.getElementsByClassName("floor");
        for (var f = 0; f < floors.length; f++) {
            var floor = floors[f];
            var id = floor.getAttribute('id');
            if (id === null) {
                id = 'floor' + f;
                while (document.getElementById(id) !== null) {
                    id = id + '0';
                }
                floor.setAttribute('id', id);
            }
            var table = document.createElement('table');
            var wall = 0;
            for (var i = 0; i < 7; i++) {
                var row = document.createElement('tr');
                for (var j = 0; j < 7; j++) {
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
            var layout = parseInt(getParameterByName(id), 16);
            if (layout > 0 && set_layout(id, layout))
                floor.setAttribute('layout', layout.toString(16));
        }
        update_href();
    }

    function update_href() {
        var link = window.location.protocol + '//';
        link += window.location.hostname;
        if (window.location.port)
            link += ':' + window.location.port;
        link += window.location.pathname + '?';
        if (show_heat)
            link += 'heat=on&';

        var layouts = [];
        var floors = document.getElementsByClassName("floor");
        for (var f = 0; f < floors.length; f++) {
            layouts.push(floors[f].getAttribute('id') + '=' + floors[f].getAttribute('layout'));
        }
        console.log(link);

        document.getElementById('burgle_href').href = link + layouts.join('&');
    }

    if (window.addEventListener)
        window.addEventListener('load', init_floors, false);
    else
        window.attachEvent('onload', init_floors); //IE

    return {
        show_heat: function (show) {
            show_heat = show;
            var floors = document.getElementsByClassName("floor");
            for (var f = 0; f < floors.length; f++) {
                var layout = floors[f].getAttribute('layout');
                if (layout !== null) {
                    set_layout(floors[f].getAttribute('id'), parseInt(layout, 16));
                }
            }
            update_href();
        },
        generate: function (id) {
            var floors;
            if (id === undefined || id === 'all')
                floors = document.getElementsByClassName("floor");
            else
                floors = [document.getElementById(id)];
            for (var f = 0; f < floors.length; f++) {
                while (true) {
                    var walls = [];
                    var layout = 0;
                    for (var w = 0; w < 8; ) {
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
    };

}());
