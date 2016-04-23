var expect = require('chai').expect;
var Az = require('../dist/az');

describe('Az.Tokens', function() {
  it('should return empty array for empty string', function () {
    var result = Az.Tokens('').done();
    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });

  it('should parse simple tokens correctly', function () {
    var result = Az.Tokens('Мама мыла раму. What is 42?').done();
    expect(result).to.be.an('array');
    expect(result).to.have.length(13);
    expect(result[0].type).to.equal('WORD');      // Мама
    expect(result[0].subType).to.equal('CYRIL');

    expect(result[1].type).to.equal('SPACE');     // пробел

    expect(result[2].type).to.equal('WORD');      // мыла
    expect(result[2].subType).to.equal('CYRIL');

    expect(result[3].type).to.equal('SPACE');     // пробел

    expect(result[4].type).to.equal('WORD');      // раму
    expect(result[4].subType).to.equal('CYRIL');

    expect(result[5].type).to.equal('PUNCT');     // точка

    expect(result[6].type).to.equal('SPACE');     // пробел

    expect(result[7].type).to.equal('WORD');      // What
    expect(result[7].subType).to.equal('LATIN');

    expect(result[8].type).to.equal('SPACE');     // пробел

    expect(result[9].type).to.equal('WORD');      // is
    expect(result[9].subType).to.equal('LATIN');

    expect(result[10].type).to.equal('SPACE');    // пробел

    expect(result[11].type).to.equal('NUMBER');   // 42

    expect(result[12].type).to.equal('PUNCT');    // вопросительный знак
  });

  it('should parse links correctly', function () {
    var result = Az.Tokens('http://site,vk.com,сайт.рф .ru com.').done();
    expect(result).to.be.an('array');
    expect(result).to.have.length(11);
    expect(result[0].type).to.equal('LINK');
    expect(result[1].type).to.equal('PUNCT');
    expect(result[2].type).to.equal('LINK');
    expect(result[3].type).to.equal('PUNCT');
    expect(result[4].type).to.equal('LINK');
    expect(result[5].type).to.equal('SPACE');
    expect(result[6].type).to.equal('PUNCT');
    expect(result[7].type).to.equal('WORD');
    expect(result[7].subType).to.equal('LATIN');
    expect(result[8].type).to.equal('SPACE');
    expect(result[9].type).to.equal('WORD');
    expect(result[9].subType).to.equal('LATIN');
    expect(result[10].type).to.equal('PUNCT');
  });

  it('should parse hashtags correctly', function () {
    var result = Az.Tokens('#1 #tag # #tag@user').done();
    expect(result).to.be.an('array');
    expect(result).to.have.length(8);
    expect(result[0].type).to.equal('OTHER');
    expect(result[1].type).to.equal('NUMBER');
    expect(result[2].type).to.equal('SPACE');
    expect(result[3].type).to.equal('HASHTAG');
    expect(result[4].type).to.equal('SPACE');
    expect(result[5].type).to.equal('OTHER');
    expect(result[6].type).to.equal('SPACE');
    expect(result[7].type).to.equal('HASHTAG');
  });
});