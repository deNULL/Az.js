;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az) { 'use strict';
  // TBD: Syntax analyzer
  var defaults = {};

  var SyntaxGroup = function(type, score, st, en, childs, main, tag) {
    this.type = type;
    this.score = score;
    this.st = st;
    this.en = en;
    this.childs = childs;
    this.id = [type];
    for (var i = 0; i < childs.length; i++) {
      this.id.push(childs[i].id);
    }
    this.id = '(' + this.id.join('-') + ')';
    if (typeof main == 'undefined') {
      this.main = childs[0];
      this.mainIndex = 0;
    } else
    if (typeof main == 'number') {
      this.main = childs[main];
      this.mainIndex = main;
    } else {
      this.main = main;
      this.mainIndex = childs.indexOf(main);
    }
    this.token = this.main.token;
    this.morph = this.main.morph;
    this.tag = tag || this.morph.tag;
  }

  SyntaxGroup.prototype.merge = function(other, scoreMult, flatMerge, keepMain, type) {
    return new SyntaxGroup(
      type || (keepMain ? this : other).type, this.score * other.score * (scoreMult || 1.0), 
      this.st, other.en, 
      flatMerge ? this.childs.concat(other.childs) : [this, other], 
      flatMerge ? (keepMain ? this : other) : (keepMain ? this.main : other.main));
  }

  var _atom_id = 0;
  var AtomicSyntaxGroup = function(score, pos, token, morph, tag) {
    this.score = score;
    this.st = pos;
    this.en = pos;
    this.token = token;
    this.morph = morph;
    this.tag = tag || morph.tag;
    this.type = this.tag.POST;
    this.childs = [this];
    this.main = this;
    this.id = _atom_id++;
  }

  AtomicSyntaxGroup.prototype = Object.create(SyntaxGroup.prototype);
  AtomicSyntaxGroup.prototype.constructor = AtomicSyntaxGroup;

  var Syntax = function(tokens, config) {
    if (this instanceof Syntax) {

      this.tokens = [];
      this.groups = [];
      this.used = {};
      if ((typeof tokens == 'string') || (Object.prototype.toString.call(tokens) === '[object Array]')) {
        this.config = config ? Az.extend(defaults, config) : defaults;
        this.append(tokens);
      } else {
        this.config = tokens ? Az.extend(defaults, tokens) : defaults;
      }
      this.index = -1;
    } else {
      return new Syntax(tokens, config);
    }
  }

  Syntax.prototype.append = function(tokens, config) {
    config = config ? Az.extend(this.config, config) : this.config;
    tokens = (typeof tokens == 'string') ? Az.Tokens(tokens, config).done() : tokens;
    this.tokens = this.tokens.concat(tokens);

    var groups = this.groups.length ? this.groups[this.groups.length - 1] : [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      // Ignore whitespace
      if ((token.type == 'SPACE') || (!('type' in token) && token.toString().match(/^[\u0000-\u0020\u0080-\u00A0]*$/))) {
        this.groups.push(groups);
        //this.groups.push([]);
        continue;
      }

      var str = token.toString();
      var lstr = str.toLocaleLowerCase();
      var ngroups = [];
      var parses = Az.Morph(str, config);

      for (var j = 0; j < parses.length && (j < 2 || Math.abs(parses[0].score - parses[j].score) < 1e-6); j++) {
        var morph = parses[j];
        var atom = new AtomicSyntaxGroup(morph.score, i, token, morph);
        var norm = morph.normalize().toString();
        var nbefore = ngroups.length;

        var queue = [atom];
        while (queue.length) {
          var group = queue.shift();
          
          if (group.id in this.used) {
            continue;
          }

          this.used[group.id] = true;
          ngroups.push(group);

          if (group.st == 0) {
            continue;
          }

          var groups = this.groups[group.st - 1];
          for (var k = 0; k < groups.length; k++) {
            var prev = groups[k];
            if (!(prev.type in Syntax.Rules)) {
              continue;
            }
            var rules;

            // Rules by previous group type
            rules = Syntax.Rules[prev.type];
            for (var u = 0; u < rules.length; u++) {
              var merge = rules[u](prev, group, this.groups);
              if (merge) {
                queue.push(merge);
              }
            }

            // All non-specific rules
            rules = Syntax.Rules['*'];
            for (var u = 0; u < rules.length; u++) {
              var merge = rules[u](prev, group, this.groups);
              if (merge) {
                queue.push(merge);
              }
            }
          }
        }
      }

      groups = ngroups;
      this.groups.push(groups);
    }

  }

  Syntax.Rules = {};
  function addRule(types, rule) {
    if (!rule) {
      rule = types;
      types = ['*'];
    }
    if (Object.prototype.toString.call(types) !== '[object Array]') {
      types = [types];
    }
    for (var i = 0; i < types.length; i++){
      var type = types[i];
      if (!(type in Syntax.Rules)) {
        Syntax.Rules[type] = [];
      }
      Syntax.Rules[type].push(rule);
    }
  }

  addRule('NUMB', function(prev, group) {
    var pval = prev.morph.toString().split(/[.,]/)[0].substr(-4);

    if (!prev.tag.real && pval.length < 4 && (group.tag.POST == 'NUMB')) {
      var val = group.morph.toString().split(/[.,]/)[0];
      // 12 300 можно склеить в одно число (=12300),
      // 12 -300 нельзя
      // 12.4 300 нельзя
      // 12 3400 нельзя
      // 1234 300 нельзя
      if ((val.length == 3) && (val[0] != '−') && (val[0] != '-')) {
        return prev.merge(group, 1.0, true);
      }
    }
  });

  addRule('NUMB', function(prev, group) {
    if (!(group instanceof AtomicSyntaxGroup)) {
      return;
    }

    var norm = group.morph.normalize().toString();
    var pval = prev.morph.toString().split(/[.,]/)[0].substr(-4);
    var cat = Az.Morph.plural(parseInt(pval, 10));

    if ((['тысяча', 'миллион', 'миллиард'].indexOf(norm) > -1) &&
        ((cat == 'one' && group.tag.sing) ||
         (cat == 'few' && group.tag.plur) ||
         (cat == 'many' && group.tag.plur && !group.tag.nomn && !group.tag.accs))) {
      return prev.merge(group, 1.0, true);
    }
  });

  addRule('ADJF', function(prev, group) {
    if (group.type != 'NOUN') {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'], true)) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0);
  });

  addRule('NOUN', function(prev, group) {
    if (group.type != 'NOUN' || !group.tag.gent) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, true);
  });

  addRule('NOUN', function(prev, group) {
    if (group.type != 'VERB' || !prev.tag.nomn) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, false, 'NOUN-VERB');
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

  addRule('PREP', function(prev, group) {
    if (group.type != 'NOUN') {
      return;
    }

    var pstr = prev.morph.toString();
    if (!(pstr in preps)) {
      console.log('not found: ' + pstr);
      return;
    }

    if (!(group.tag.CAse in preps[pstr])) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, false, 'PREP-NOUN');
  });

  addRule('NPRO', function(prev, group) {
    if (group.type != 'PREP-NOUN') {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, true);
  });

  addRule('PREP-NOUN', function(prev, group) {
    if (group.type != 'NOUN-VERB') {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0);
  });

  addRule('NOUN-VERB', function(prev, group) {
    if (group.type != 'PREP-NOUN') {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, true);
  });

  addRule('NOUN-VERB', function(prev, group) {
    if ((group.type != 'NOUN' && group.type != 'NPRO') || !prev.tag.tran || !group.tag.accs) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, true, true, 'NOUN-VERB-NOUN');
  });

  addRule('NOUN-VERB', function(prev, group) {
    if ((group.type != 'NOUN' && group.type != 'NPRO') || !group.tag.datv) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, true);
  });

  addRule('PRTF', function(prev, group) {
    if (group.type != 'PREP-NOUN') {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0, false, true);
  });

  addRule('PRTF', function(prev, group) {
    if (prev.type != 'PRTF' || group.type != 'NOUN') {
      return;
    }

    if (!prev.tag.matches(group.tag, ['GNdr', 'NMbr', 'CAse'])) {
      return;
    }

    // TODO: check length?
    return prev.merge(group, 1.0);
  });

  // «красивый дом»
  // Любая группа в кавычках
  var quotes = {
    '»': '«',
    '"': '"'
  }
  addRule(function(prev, group, groups) {
    if (group.type != 'PNCT' || prev.isQuote || prev.st == 0 || !(group.morph.toString() in quotes)) {
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

  Syntax.prototype.done = function() {

  }

  return Syntax;
}));