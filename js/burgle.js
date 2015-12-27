"use strict";

var Burgle = (function() {
  var heatmap = false,
      floors  = 3,
      size    = 4,
      walls   = 8,
      shaft   = -1,
      size_sq = size * size;
  
  var getParameterByName = function(name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
  
  var wallsToString = function(walls) {
    var val=0,
        j = (walls.length-1) % 5,
        str='';
    for (var i=walls.length-1; i>=0; i--) {
       if (walls[i]) {
          val |= (1 << j);
       }
       j--;
       if (j < 0) {
          str += val.toString(32);
          val = 0;
          j = 4;
       }
    }
    return str;
  }

  var parseWalls = function(str) {
      var walls = [],
          i = str.length,
          c, j;
      while(i--) {
        c = parseInt(str[i], 32);
        for (j = 0; j < 5; j++) {
            walls.push(!!(c & (1 << j)));
        }
      }
      return walls;
  }
  
  var to_floor = function(walls) {
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
  
  var valid = function(floor) {
      var check = [shaft == 0 ? 1 : 0];
      var visited = 0;
      if (shaft > -1) {
          floor[shaft].v = true;
          visited++;
      }
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
  
  var update_distance = function(a_ind, b_ind, dist) {
      if (a_ind === shaft || b_ind === shaft) return;

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
  
  var build_distance = function(floor) {
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
  var find_clockwise = function(from, to, options) {
      var dy = Math.floor(to / size) - Math.floor(from / size);
      var dx = to % size - from % size;
      var target = Math.atan2(dy, dx);
      var max = 0;
      var dir;
      for (var i = 0; i < options.length; i++) {
          var o = options[i];
          var r = o[0] - target;
          if (r < 0)
              r += 2 * Math.PI;
          if (r > max) {
              max = r;
              dir = o[1];
          }
      }
      return dir;
  }
  
  var walk = function(from, to, floor, dist) {
      if (from === shaft || to === shaft) return;

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
  
  var generate_heatmap = function(id, floor) {
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
          if (i !== shaft) {
              heat = (1.0 - (floor[i].heat - (size_sq - 1)) / 168) * 240;
              document.getElementById(id + '_t' + i).style.backgroundColor = 'hsl(' + heat + ',100%,50%)';
          }
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
  
  var set_layout = function(id, walls) {
      var floor = to_floor(walls);
      if (!valid(floor))
          return false;
      var f = document.getElementById(id);
      f.setAttribute('layout', wallsToString(walls));
      if (shaft > -1) {
          document.getElementById(id + '_t' + shaft).className = 'shaft';
      }
      for (var w = 0; w < size * (size - 1) * 2; w++) {
          document.getElementById(id + '_' + w).className = walls[w] ? 'wall' : '';
      }
      generate_heatmap(id, floor);
      return true;
  }
  
  var init = function() {
      var j = getParameterByName('job');
      if (j !== "") document.getElementById('job').options[j].selected = true;
      var s = getParameterByName('s');
      if (s !== "") shaft = parseInt(s, 36);
      if (getParameterByName('heat') !== "") {
          heatmap = true;
          var heat = document.getElementById('burgle_heat');
          if (heat !== null) heat.checked = heatmap;
      }
      new_job();
  }
  
  var update_dom = function() {
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
  		floor.setAttribute('class', (size == 5 ? 'knox' : 'bank') + ' floor');
  		floor.setAttribute('id', id);
          var table = document.createElement('table');
          var wall = 0;
          for (var i = 0; i < cols; i++) {
              var row = document.createElement('tr');
              for (var j = 0; j < cols; j++) {
                  var td = document.createElement('td');
                  if (i % 2 === 0 && j % 2 === 0) {
                      td.className = 'tile';
                      td.setAttribute('id', id + '_t' + (i / 2 * size + (j / 2)));
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
  		btn.setAttribute('onClick', "Burgle.generate('f" + f + "')");
  		btn.appendChild(document.createTextNode("Generate " + (f + 1) + ". Floor"));
  
  		container.appendChild(floor);
  		container.appendChild(btn);
  		floorElem.appendChild(container);
  
          var layout = getParameterByName(id);
          var walls = parseWalls(layout);
          if (walls.length != 0)
            set_layout(id, walls);
      }
      update_href();
  }
  
  var update_href = function() {
      var link = window.location.protocol + '//';
      link += window.location.hostname;
      if (window.location.port)
          link += ':' + window.location.port;
      link += window.location.pathname + '?job=';
      link += document.getElementById('job').selectedIndex;
      if (heatmap)
          link += '&heat=on';
      if (shaft > -1) link += '&s=' + shaft.toString(36);
      var floors = document.getElementsByClassName("floor");
      for (var f = 0; f < floors.length; f++) {
          link += '&' + floors[f].getAttribute('id') + '=' + floors[f].getAttribute('layout');
      }
      document.getElementById('burgle_href').href = link;
  }
  
  var generate = function(id) {
      var floors;
      if (id === undefined || id === 'all')
          floors = document.getElementsByClassName("floor");
      else
          floors = [document.getElementById(id)];
      var max = 2 * size * (size - 1);
      var permanent_walls = [];
      var shaft_walls = [];
      if (size === 5) {
          if (shaft > -1) {
              for (var f = 0; f < floors.length; f++) {
                  var id = floors[f].getAttribute('id');
                  document.getElementById(id + '_t' + shaft).className = 'tile';
              }
          }
          shaft = Math.floor(Math.random() * size_sq);
          shaft_walls = get_walls(shaft);
          shaft_walls.forEach(function(w) {
              permanent_walls[w] = true;
          });
      }
      for (var f = 0; f < floors.length; f++) {
          var id = floors[f].getAttribute('id');
          while (true) {
              var wall = permanent_walls.slice();
              for (var w = 0; w < walls;) {
                  var n = Math.floor(Math.random() * max);
                  if (!wall[n]) {
                      w++;
                      wall[n] = true;
                  }
              }
              shaft_walls.forEach(function(w) {
                wall[w] = false;
              });
              if (set_layout(id, wall)) {
                  break;
              }
          }
      }
      update_href();
  }
  
  var get_walls = function(tile) {
      var dec = size - 1,
          max = 2 * size * dec,
          off = tile % size,
          row = Math.floor(tile / size) * (size + dec),
          ind = row + off,
          val = [];
      if (off > 0)   val.push(ind - 1);
      if (off < dec) val.push(ind);
      if (ind >= size + dec) val.push(ind - size);
      if (ind + dec < max) val.push(ind + dec);
      return val;
  }
  
  var set_dims = function(opt) {
    size = opt.size;
    shaft = opt.shaft;
    size_sq = size * size;
  }

  var new_job = function() {
    var j = document.getElementById('job');
    var info = j.options[j.selectedIndex].value.split(":");
    floors = parseInt(info[0]);
    size = parseInt(info[1]);
    walls = parseInt(info[2]);
    shaft = -1;
    size_sq = size * size;
    update_dom();
  }
  
  var show_heat = function(show) {
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
              var floor = to_floor(walls);
              generate_heatmap(floors[f].getAttribute('id'), floor);
          }
      }
      update_href();
  }

  return {
    find_clockwise: find_clockwise,
    generate: generate,
    get_walls: get_walls,
    init: init,
    new_job: new_job,
    parseWalls: parseWalls,
    show_heat: show_heat,
    to_floor: to_floor,
    valid: valid,
    wallsToString: wallsToString,
    _set: set_dims
  }
})();
module.exports = Burgle;
