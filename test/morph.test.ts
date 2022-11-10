import {Morph, Init} from '../dist/az.morph'

describe('Az.Morph', function() {
  beforeAll(function(done) {
    Init('dicts', done);
  });

  it('should not parse latin words', function () {
    let result = Morph('word');
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
  });
});