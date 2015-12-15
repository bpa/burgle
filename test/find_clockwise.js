/// <reference path="../js/burgle.js" />

var assert = chai.assert;

size = 3;
// 0 1 2   -π/2
// 3 4 5  π  ⟡  0
// 6 7 8    π/2
var n = Math.PI * -.5,
    e = 0,
    s = Math.PI * .5,
    w = Math.PI;

describe('find_clockwise', function() {
    it("should go e when traveling SE", function() {
        assert.equal(find_clockwise(0, 4, [[e, 1],[s, 3]]), 1);
    });
    it("should go s when traveling SW", function() {
        assert.equal(find_clockwise(2, 4, [[w, 1],[s, 5]]), 5);
    });
    it("should go w when traveling NW", function() {
        assert.equal(find_clockwise(8, 4, [[n, 5],[w, 7]]), 7);
    });
    it("should go r when traveling NE", function() {
        assert.equal(find_clockwise(6, 4, [[n, 3],[e, 7]]), 3);
    });
});
