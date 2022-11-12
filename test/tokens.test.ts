import {Tokens} from '../dist/az.tokens'

describe('Az.Tokens', function() {
  it('should return empty array for empty string', function () {
    let result = new Tokens('').done();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should parse simple tokens correctly', function () {
    let result = new Tokens('Мама мыла раму. What is 42?').done();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(13);
    expect(result[0].type).toEqual('WORD');      // Мама
    expect(result[0].subType).toEqual('CYRIL');

    expect(result[1].type).toEqual('SPACE');     // пробел

    expect(result[2].type).toEqual('WORD');      // мыла
    expect(result[2].subType).toEqual('CYRIL');

    expect(result[3].type).toEqual('SPACE');     // пробел

    expect(result[4].type).toEqual('WORD');      // раму
    expect(result[4].subType).toEqual('CYRIL');

    expect(result[5].type).toEqual('PUNCT');     // точка

    expect(result[6].type).toEqual('SPACE');     // пробел

    expect(result[7].type).toEqual('WORD');      // What
    expect(result[7].subType).toEqual('LATIN');

    expect(result[8].type).toEqual('SPACE');     // пробел

    expect(result[9].type).toEqual('WORD');      // is
    expect(result[9].subType).toEqual('LATIN');

    expect(result[10].type).toEqual('SPACE');    // пробел

    expect(result[11].type).toEqual('NUMBER');   // 42

    expect(result[12].type).toEqual('PUNCT');    // вопросительный знак
  });

  it('should parse links correctly', function () {
    let result = new Tokens('http://site,vk.com,сайт.рф .ru com.').done();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(11);
    expect(result[0].type).toEqual('LINK');
    expect(result[1].type).toEqual('PUNCT');
    expect(result[2].type).toEqual('LINK');
    expect(result[3].type).toEqual('PUNCT');
    expect(result[4].type).toEqual('LINK');
    expect(result[5].type).toEqual('SPACE');
    expect(result[6].type).toEqual('PUNCT');
    expect(result[7].type).toEqual('WORD');
    expect(result[7].subType).toEqual('LATIN');
    expect(result[8].type).toEqual('SPACE');
    expect(result[9].type).toEqual('WORD');
    expect(result[9].subType).toEqual('LATIN');
    expect(result[10].type).toEqual('PUNCT');
  });

  it('should parse hashtags correctly', function () {
    let result = new Tokens('#1 #tag # #tag@user').done();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(8);
    expect(result[0].type).toEqual('OTHER');
    expect(result[1].type).toEqual('NUMBER');
    expect(result[2].type).toEqual('SPACE');
    expect(result[3].type).toEqual('HASHTAG');
    expect(result[4].type).toEqual('SPACE');
    expect(result[5].type).toEqual('OTHER');
    expect(result[6].type).toEqual('SPACE');
    expect(result[7].type).toEqual('HASHTAG');
  });
});