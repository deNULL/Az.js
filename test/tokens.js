var expect = require('chai').expect;
var Az = require('..');

describe('Az.Tokens', function() {
  it('should return empty array for empty string', function () {
    var result = Az.Tokens('').done();
    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
});