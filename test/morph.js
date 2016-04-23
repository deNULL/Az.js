var expect = require('chai').expect;
var Az = require('../dist/az');

describe('Az.Morph', function() {
  before(function(done) {
    Az.Morph.init('dicts', done);
  });

  it('should not parse latin words', function () {
    var result = Az.Morph('word');
    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
});