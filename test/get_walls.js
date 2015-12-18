// 0 1  ⬛ 0 ⬛ ┃ 0 1 2  ⬛ 0 ⬛ 1 ⬛ ┃ 0 1 2 3  ⬛ 0 ⬛ 1 ⬛ 2 ⬛  00
//      1   2 ┃        2   3   4 ┃          3   4   5   6
// 2 3  ⬛ 3 ⬛ ┃ 3 4 5  ⬛ 5 ⬛ 6 ⬛ ┃ 4 5 6 7  ⬛ 7 ⬛ 8 ⬛ 9 ⬛
//            ┃        7   8   9 ┃          0   1   2   3  10
//            ┃ 6 7 8  ⬛ a ⬛ b ⬛ ┃ 8 9 a b  ⬛ 4 ⬛ 5 ⬛ 6 ⬛
//            ┃                  ┃          7   8   9   0
//            ┃                  ┃ c d e f  ⬛ 1 ⬛ 2 ⬛ 3 ⬛  20
var b = require('../js/burgle');
var assert = require('chai').assert;
describe('get_walls', function() {
    function check_walls(ind, wanted, direction) {
        var w = b.get_walls(ind);
        it(ind + ' should return ' + direction, function() {
            assert.sameMembers(w, wanted);
        });
    }

    describe('2x2', function () {
        b._set({size: 2});
        check_walls(0, [0, 1], "se");
        check_walls(1, [0, 2], "sw");
        check_walls(2, [1, 3], "nw");
        check_walls(3, [2, 3], "ne");
    });

    describe('3x3', function () {
        b._set({size: 3});
        check_walls(0, [0, 2],       "se");
        check_walls(1, [0, 1, 3],    "esw");
        check_walls(2, [1, 4],       "sw");
        check_walls(3, [2, 5, 7],    "nes");
        check_walls(4, [3, 5, 6, 8], "nesw");
        check_walls(5, [4, 6, 9],    "nws");
        check_walls(6, [7, 10],      "ne");
        check_walls(7, [8, 10, 11],  "wne");
        check_walls(8, [9, 11],      "nw");
    });

    describe('4x4', function () {
        b._set({size: 4});
        check_walls(0, [0, 3], "se");
        check_walls(9, [11, 14, 15, 18], "se");
    });
});
