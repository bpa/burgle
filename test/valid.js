/* Test cases as box drawings, drawing *must* start on the line after the declaration
Valid: No walls
╭─────╮
│     │
│     │
│     │
│     │
│     │
╰─────╯
Not valid: All walls
╭─┬─┬─╮
│ │ │ │
├─┼─┼─┤
│ │ │ │
├─┼─┼─┤
│ │ │ │
╰─┴─┴─╯
Valid: Open layout
╭─────╮
│     │
├─╴ ╶─┤
│     │
├─╴ ╶─┤
│     │
╰─────╯
Valid: No walls and a shaft
╭─────╮
│     │
│     │
│  s  │
│     │
│     │
╰─────╯
Not valid: Tile blocked in se
╭─────╮
│     │
│     │
│     │
│   ┌─┤
│   │ │
╰───┴─╯
Not valid: Tile blocked in center
╭─────╮
│     │
│ ┌─┐ │
│ │ │ │
│ └─┘ │
│     │
╰─────╯
Valid: Long path
╭─────╮
│     │
├───┐ │
│   │ │
│ ╶─┘ │
│     │
╰─────╯
Valid: Long path with shaft
╭─────╮
│     │
├───┐ │
│  s│ │
│ ╶─┘ │
│     │
╰─────╯
Valid: Long path with shaft at 0
╭─────╮
│s    │
├───┐ │
│   │ │
│ ╶─┘ │
│     │
╰─────╯
Not valid: Shaft blocking tile
╭─────╮
│     │
├───┐ │
│s  │ │
│ ╶─┘ │
│     │
╰─────╯
*/
var b = require('../js/burgle');
var assert = require('chai').assert;
    var action, test, checks = [];

    function look_for_test(line) {
        var wanted = line.match(/^\s*(not )?valid:\s*(.*)/i);
        if (wanted) {
            test = {
                shaft: -1,
                valid: wanted[1] === undefined,
                name: wanted[2],
                walls: [],
                line: 0
            };
            checks.push(test);
            action = look_for_test_line;
        }
    }

    function look_for_test_line(line) {
        if (test.line > 0) {
            for (var i = (test.line % 2) + 1; i < 6; i+=2) {
                test.walls.push(line.substr(i,1) !== ' ');
            }
        }
        if (test.line % 2 === 1) {
            for (var i=1; i<6; i+=2) {
                if (line.substr(i,1) !== ' ') {
                    test.shaft = Math.floor(test.line / 2) * 3 + Math.floor(i / 2);
                }
            }
        }
        test.line++;
        if (test.line === 6) {
            action = look_for_test;
        }
    }

    var lines = require('readline').createInterface({
      input: require('fs').createReadStream('test/valid.js'),
      terminal: false
    });

    lines.on('line', function (line) {
        if (line.match(/\/\*/)) { //look for opening comment
            action = look_for_test;
            return;
        }
        if (line.match(/\*\//)) {
            action = undefined;
            return;
        }
        if (action !== undefined)
            action(line);
    });

    lines.on('close', function() {
        describe('valid', function() {
            checks.forEach(function(test) {
                var is = test.valid ? ' is ' : ' is not ';
                it(test.name + is + 'a valid layout', function() {
                    b._set({shaft: test.shaft, size: 3});
                    var floor = b.to_floor(test.walls);
                    assert.equal(b.valid(floor), test.valid);
                });
            });
        });
    });
