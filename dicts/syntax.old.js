;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax.Rules', ['Az.Syntax'], factory) :
  factory(global.Az);
}(this, function (Az) { 'use strict';
  var addRule = Az.Syntax.addRule;

  // Правила формирования чисел

  // 125 700
  addRule('NUMBER!', 'NUMBER!', function(prev, group) {
    var pval = prev.morph.toString().split(/[.,]/)[0].substr(-4);

    if (!prev.tag.real && pval.length < 4 && (group.tag.POST == 'NUMB')) {
      var val = group.morph.toString().split(/[.,]/)[0];
      // 12 300 можно склеить в одно число (=12300),
      // 12 -300 нельзя
      // 12.4 300 нельзя
      // 12 3400 нельзя
      // 1234 300 нельзя
      if ((val.length == 3) && (val[0] != '−') && (val[0] != '-')) {
        return prev.mergeFlatRight(group);
      }
    }
  });

  // 125 миллионов
  addRule('NUMBER!', 'NP!', function(prev, group) {
    if (prev.tag.POST != 'NUMB') {
      return;
    }

    var norm = group.morph.normalize().toString();
    var pval = prev.morph.toString().split(/[.,]/)[0].substr(-4);
    var cat = Az.Morph.plural(parseInt(pval, 10));

    if ((['тысяча', 'миллион', 'миллиард'].indexOf(norm) > -1) &&
        ((cat == 'one' && group.tag.sing) ||
         (cat == 'few' && group.tag.plur) ||
         (cat == 'many' && group.tag.plur && !group.tag.nomn && !group.tag.accs))) {
      return prev.mergeFlatRight(group);
    }
  });

  // пятьсот тысяч
  addRule('NUMBER!', 'NP!', function(prev, group) {
    var norm1 = prev.morph.normalize().toString();
    var norm2 = group.morph.normalize().toString();

    if (['тысяча', 'миллион', 'миллиард'].indexOf(norm2) == -1) {
      return;
    }

    if (norm1 == 'два') {
      if (!prev.tag.matches(group.tag, ['GNdr'])) {
        return;
      }
    }

    if (['два', 'три', 'четыре'].indexOf(norm1) > -1) {
      if (prev.tag.nomn || prev.tag.accs) {
        // два миллиона, три тысячи
        if (group.tag.plur) {
          return;
        }
        if (!group.tag.gent) {
          return;
        }
      } else {
        // двум миллионам, трех тысяч
        if (!group.tag.plur) {
          return;
        }
        if (!prev.tag.matches(group.tag, ['CAse'])) {
          return;
        }
      }
    } else
    if (!group.tag.plur) {
      return;
    } else
    if (group.tag.gent) {
      // пятьсот миллионов, семь тысяч
      if (!prev.tag.nomn && !prev.tag.accs) {
        return;
      }
    } else {
      // пятистам миллионам, семи тысячам
      if (prev.tag.nomn || prev.tag.accs) {
        return;
      }
      if (!prev.tag.matches(group.tag, ['CAse'])) {
        return;
      }
    }

    return prev.mergeFlatLeft(group);
  });

  // одна тысяча
  addRule('ADJF!', 'NP!', function(prev, group) {
    if (!prev.tag.Apro) {
      return;
    }

    var norm1 = prev.morph.normalize().toString();
    var norm2 = group.morph.normalize().toString();

    if (['тысяча', 'миллион', 'миллиард'].indexOf(norm2) == -1) {
      return;
    }

    if (norm1 != 'один') {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'CAse']) || !group.tag.sing) {
      return;
    }

    return prev.mergeFlatRight(group, 1.0, 'NUMBER');
  });

  // статья 123, пункт 13

  // такой красивый
  addRule('ADJF!', 'ADJF', function(prev, group) {
    if (group.tag.POST != 'ADJF') {
      return;
    }

    var norm = prev.morph.normalize().toString();

    if (norm != 'такой' && norm != 'самый') {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return;
    }

    return prev.mergeFlatRight(group);
  });


  // Иван Петров, Петров Иван
  addRule('NP!', 'NP!', function(prev, group) {
    if (prev.tag.Name && group.tag.Surn && prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return prev.mergeFlatRight(group, 'PERSON', {
        name: prev,
        surname: group
      });
    } else
    if (prev.tag.Surn && prev.tag.Name && prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return prev.mergeFlatRight(group, 'PERSON', {
        name: group,
        surname: prev
      });
    }
  });

  // Правила формирования именных групп ('NP')

  // красивый стол
  addRule(['ADJF', 'ADJF-COORD'], 'NP', function(prev, group, tokens) {
    if (prev.tag.Apro) {
      var norm = prev.morph.normalize().toString();
      if (norm == 'один') {
        if (['тысяча', 'миллион', 'миллиард'].indexOf(group.morph.normalize().toString()) != -1) {
          return;
        }
      } else
      if (norm == 'такой') {
        return;
      } else
      if (norm == 'самый') {
        var norm2 = group.morph.normalize().toString();
        if (['сок', 'разгар', 'дело', 'начало', 'конец'].indexOf(norm2) == -1) {
          return;
        }
      }
    }

    var norm = prev.morph.normalize().toString();

    if (norm == 'такой' || norm == 'самый') {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return;
    }

    var punct = Az.Tokens.nextToken(tokens, prev.en, ['SPACE'], true);
    if (punct && punct.index < group.st) {
      return;
    }

    return prev.mergeRight(group);
  });

  // стол друга
  addRule('NP', 'NP', function(prev, group) {
    if (!group.tag.gent) {
      return;
    }

    // TODO: check length?
    return prev.mergeLeft(group);
  });


  // очень красивый
  addRule('ADVB!', ['ADJF', 'ADJS'], function(prev, group) {
    if (!group.tag.Qual) {
      return;
    }

    return prev.mergeRight(group);
  });


  // Вспомогательные конструкции (не остаются в финальных вариантах разбора):
  // запятая + прилагательное, сочинительный союз + прилагательное

  addRule('PNCT!', 'ADJF', function(prev, group, tokens, groups) {
    if (prev.morph.toString() == ',') {
      return prev.mergeRight(group, '~COMMA-ADJF');
    }
  });

  addRule('CONJ!', 'ADJF', function(prev, group, tokens, groups) {
    if (['и', 'или'].indexOf(prev.morph.toString()) != -1) {
      return prev.mergeRight(group, '~CONJ-ADJF');
    }
  });


  // однородные прилагательные
  // хороший, плохой и злой

  addRule('ADJF', ['~COMMA-ADJF', '~CONJ-ADJF'], function(prev, group, tokens, groups) {
    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return;
    }

    return prev.mergeLeft(group, 'ADJF-COORD', {
      isClosed: group.type == '~CONJ-ADJF'
    });
  });

  addRule('ADJF-COORD', ['~COMMA-ADJF', '~CONJ-ADJF'], function(prev, group, tokens, groups) {
    // Запрещаем конструкции типа 'хороший и плохой и злой'
    if (prev.isClosed) {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return;
    }

    return prev.mergeFlatLeft(group, 'ADJF-COORD', {
      isClosed: group.type == '~CONJ-ADJF'
    });
  });
  

  // Правила формирования

  // я иду
  // дом строится
  addRule(['NP', 'NPRO'], 'VERB', function(prev, group) {
    if (!prev.tag.nomn) {
      return;
    }

    if (!prev.tag.matches(group.tag, ['NMbr'])) {
      return;
    }

    if (!prev.tag.matches(group.tag, ['PErs'], true)) {
      return;
    }

    if ((prev.type == 'NPRO' && prev.tag.PErs != '3per') || 
        (group.tag.PErs == '3per') ||
        prev.tag.matches(group.tag, ['GNdr'])) {
      return prev.mergeRight(group,
        group.particle ? 0.9 : 1.0, // обратный порядок чаще подходит для глаголов с частицей
        'NOUN-VERB');
    }
  });

  // (обратный порядок)
  //
  // пошел дождь
  // умрут люди
  addRule('VERB', ['NP', 'NPRO'], function(prev, group) {
    if (!group.tag.nomn) {
      return;
    }

    if (!group.tag.matches(prev.tag, ['NMbr'])) {
      return;
    }

    if (!group.tag.matches(prev.tag, ['PErs'], true)) {
      return;
    }

    if ((group.type == 'NPRO' && group.tag.PErs != '3per') || 
        (prev.tag.PErs == '3per') ||
        group.tag.matches(prev.tag, ['GNdr'])) {
      return prev.mergeLeft(group, 
        prev.particle ? 1.0 : 0.9, // обратный порядок чаще подходит для глаголов с частицей
        'NOUN-VERB');
    }
  });

  var preps = {
    'к': {datv: 1},
    'от': {gent: 1},
    'о': {loct: 1, accs: 1},
    'об': {loct: 1, accs: 1},
    'в': {gent: 1, accs: 1, loct: 1},
    'из': {gent: 1},
    'на': {accs: 1, loct: 1},
    'с': {gent: 1, ablt: 1},
    'со': {gent: 1, ablt: 1},
    'по': {datv: 1}
  };

  addRule('PREP', 'NP', function(prev, group) {
    var pstr = prev.morph.toString();
    if (!(pstr in preps)) {
      console.log('not found: ' + pstr);
      return;
    }

    if (!(group.tag.CAse in preps[pstr])) {
      return;
    }

    // TODO: check length?
    return prev.mergeRight(group, 'PREP-NOUN');
  });

  addRule('NPRO', 'PREP-NOUN', function(prev, group) {
    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('PREP-NOUN', 'NOUN-VERB', function(prev, group) {
    // TODO: check length?
    return prev.mergeRight(group);
  });

  addRule('VERB', 'PREP-NOUN', function(prev, group) {
    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('VERB', ['NP', 'NPRO'], function(prev, group) {
    if (!prev.tag.tran && !group.tag.accs) {
      return;
    }

    // TODO: check length?
    return prev.mergeFlatLeft(group, 'NOUN-VERB-NOUN');
  });

  addRule('VERB', ['NP', 'NPRO'], function(prev, group) {
    if (!group.tag.datv && !group.tag.gent) {
      return;
    }

    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('NOUN-VERB', 'PREP-NOUN', function(prev, group) {
    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('NOUN-VERB', ['NP', 'NPRO'], function(prev, group) {
    if (!prev.tag.tran && !group.tag.accs) {
      return;
    }

    // TODO: check length?
    return prev.mergeFlatLeft(group, 'NOUN-VERB-NOUN');
  });

  addRule('NOUN-VERB', ['NP', 'NPRO'], function(prev, group) {
    if (!group.tag.datv && !group.tag.gent) {
      return;
    }

    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('ADVB', 'NOUN-VERB-NOUN', function(prev, group) {
    if (prev.tag.Prdx) {
      return prev.mergeRight(group, 'NOUN-VERB-NOUN-PRED');
    }
  });

  addRule('NOUN-VERB-NOUN', 'ADVB', function(prev, group) {
    if (group.tag.Prdx) {
      return prev.mergeLeft(group, 'NOUN-VERB-NOUN-PRED');
    }
  });

  addRule('PRTF', 'PREP-NOUN', function(prev, group) {
    // TODO: check length?
    return prev.mergeLeft(group);
  });

  addRule('PRTF', 'NP', function(prev, group) {
    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'])) {
      return;
    }

    // TODO: check length?
    return prev.mergeRight(group);
  });

  addRule('VERB!', 'PRCL!', function(prev, group) {
    return prev.mergeLeft(group, {
      particle: group
    });
  });

  addRule('ADVB!', 'VERB!', function(prev, group) {
    return prev.mergeRight(group, {
      adverb: group
    });
  });

  // «красивый дом»
  // Любая группа в кавычках
  var quotes = {
    '»': '«',
    '"': '"'
  }
  addRule('*', 'PNCT', function(prev, group, tokens, groups) {
    if (prev.isQuote || prev.st == 0 || !(group.morph.toString() in quotes)) {
      return;
    }
    var pair = quotes[group.morph.toString()];
    var pprevs = groups[prev.st - 1];
    if (!pprevs.length || !pprevs[0].type == 'PNCT' || pprevs[0].morph.toString() != pair) {
      return;
    }


    // TODO: check length?
    var group = new SyntaxGroup(
      prev.type, 1.0,
      prev.st - 1, group.en,
      prev.childs.concat(group.childs),
      prev.main);
    group.isQuote = true;
    return group;
  });

  addRule(['NOUN-VERB', 'NOUN-VERB-NOUN', 'NOUN-VERB-NOUN-PRED'], 'PNCT!', function(prev, group) {
    var punct = group.morph.toString();
    if (['.', '!', '?', '…'].indexOf(punct) > -1) {
      return prev.mergeLeft(group, 'SENTENCE');
    }
  });

  addRule('SENTENCE', 'PNCT!', function(prev, group) {
    var punct = group.morph.toString();
    if (['.', '!', '?', '…'].indexOf(punct) > -1) {
      return prev.mergeFlatLeft(group, 'SENTENCE');
    }
  });

}));
