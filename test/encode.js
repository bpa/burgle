//Encode works on 5 bits at a time using base 32 as in/out
var b = require('../js/burgle');
var assert = require('chai').assert;
var f = false, t=true;
function isEnc(walls, exp) {
    var bin = '0b' + walls.map(function(w){return w ? '1' : '0'}).reverse().join('');
    it(bin + ' is ' + exp, function() { assert.equal(b.wallsToString(walls), exp); });
}
function isDec(str, walls) {
    var bin = '0b' + walls.map(function(w){return w ? '1' : '0'}).reverse().join('');
    it(str + ' is ' + bin, function() {
        var dec = b.parseWalls(str);
        while (dec.length > walls.length) {
            assert.isFalse(dec[dec.length - 1]);
            dec.pop();
        }
        assert.deepEqual(dec, walls);
    });
}
describe('Serialization', function() {
  describe('wallsToString', function() {
    isEnc([f], '0');
    isEnc([t], '1');
    isEnc([f,t], '2');
    isEnc([f,f,f,f,t], 'g');
    isEnc([f,f,f,f,f,t], '10');
    isEnc([f,f,f,t,f,t], '18');
    isEnc([t,t,t,t,t,t], '1v');
  });
  describe('parseWalls', function() {
    isDec('', []);
    isDec('0', [f]);
    isDec('1', [t]);
    isDec('2', [f,t]);
    isDec('g', [f,f,f,f,t]);
    isDec('10',[f,f,f,f,f,t]);
    isDec('18',[f,f,f,t,f,t]);
    isDec('1v',[t,t,t,t,t,t]);
  });
});
