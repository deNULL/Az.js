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

  SyntaxGroup.prototype.merge = function(other, scoreMult, flatMerge, leftSide, type, extras) {
    var group = new SyntaxGroup(
      type || (leftSide ? this : other).type, Math.sqrt(this.score * other.score) * (scoreMult || 1.0),
      this.st, other.en,
      extras && extras.childs ? extras.childs :
        (flatMerge ? this.childs.concat(other.childs) :
          (this.type[0] == '~' ? this.childs : [this]).concat(other.type[0] == '~' ? other.childs : [other])),
      flatMerge ? (leftSide ? this.main : other.main) :
        (leftSide ? (this.type[0] == '~' ? this.main : this) : (other.type[0] == '~' ? other.main : other)));

    if (extras) {
      for (var k in extras) {
        group[k] = extras[k];
      }
    }

    return group;
  }

  SyntaxGroup.prototype.mergeLeft = function(other, scoreMult, type, extras) {
    if (typeof scoreMult == 'string') {
      return this.merge(other, 1.0, false, true, scoreMult, type);
    }
    if (typeof scoreMult == 'object') {
      return this.merge(other, 1.0, false, true, false, scoreMult);
    }
    return this.merge(other, scoreMult, false, true, type, extras);
  }
  SyntaxGroup.prototype.mergeRight = function(other, scoreMult, type, extras) {
    if (typeof scoreMult == 'string') {
      return this.merge(other, 1.0, false, false, scoreMult, type);
    }
    if (typeof scoreMult == 'object') {
      return this.merge(other, 1.0, false, false, false, scoreMult);
    }
    return this.merge(other, scoreMult, false, false, type, extras);
  }
  SyntaxGroup.prototype.mergeFlatLeft = function(other, scoreMult, type, extras) {
    if (typeof scoreMult == 'string') {
      return this.merge(other, 1.0, true, true, scoreMult, type);
    }
    if (typeof scoreMult == 'object') {
      return this.merge(other, 1.0, true, true, false, scoreMult);
    }
    return this.merge(other, scoreMult, true, true, type, extras);
  }
  SyntaxGroup.prototype.mergeFlatRight = function(other, scoreMult, type, extras) {
    if (typeof scoreMult == 'string') {
      return this.merge(other, 1.0, true, false, scoreMult, type);
    }
    if (typeof scoreMult == 'object') {
      return this.merge(other, 1.0, true, false, false, scoreMult);
    }
    return this.merge(other, scoreMult, true, false, type, extras);
  }


  var _atom_id = 0;
  var AtomicSyntaxGroup = function(score, pos, token, morph, tag) {
    this.score = score;
    this.st = pos;
    this.en = pos;
    this.token = token;
    this.morph = morph;
    this.tag = tag || morph.tag;
    this.childs = [this];
    this.main = this;
    this.id = _atom_id++;

    if (this.tag.matches({ POST: ['NOUN'] })) {
      this.type = 'NP';
    } else
    if (this.tag.matches({ POST: ['NUMB', 'NUMR'] })) {
      this.type = 'NUMBER';
    } else {
      this.type = this.tag.POST;
    }
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
    function processRules(rules, queue, prev, group, tokens, groups) {
      for (var i = 0; i < rules.length; i++) {
        var merge = rules[i](prev, group, tokens, groups);
        if (merge) {
          queue.push(merge);
        }
      }
    }
    config = config ? Az.extend(this.config, config) : this.config;
    tokens = (typeof tokens == 'string') ? Az.Tokens(tokens, config).done() : tokens;
    this.tokens = this.tokens.concat(tokens);

    var groups = this.groups.length ? this.groups[this.groups.length - 1] : [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      // Ignore whitespace
      if ((token.type == 'SPACE')/* || (token.type == 'PUNCT')*/ || (!('type' in token) && token.toString().match(/^[\u0000-\u0020\u0080-\u00A0]*$/))) {
        this.groups.push(groups);
        //this.groups.push([]);
        continue;
      }

      var str = token.toString();
      var lstr = str.toLocaleLowerCase();
      var ngroups = [];
      var parses = Az.Morph(str, config);

      for (var j = 0; j < parses.length && (j < 3 || Math.abs(parses[0].score - parses[j].score) < 1e-6); j++) {
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

          if (group.type[0] != '~') {
            ngroups.push(group);
          }

          if (group.st == 0) {
            continue;
          }

          var groupAtom = group instanceof AtomicSyntaxGroup;

          var groups = this.groups[group.st - 1];
          for (var k = 0; k < groups.length; k++) {
            var prev = groups[k];
            var prevAtom = prev instanceof AtomicSyntaxGroup;

            var rules, subrules;
            if (prev.type in Syntax.Rules) {
              // Rules by previous group type
              rules = Syntax.Rules[prev.type];
              if (group.type in rules) {
                processRules(rules[group.type], queue, prev, group, this.tokens, this.groups);
              }

              if (groupAtom && (group.type + '!' in rules)) {
                processRules(rules[group.type + '!'], queue, prev, group, this.tokens, this.groups);
              }

              if ('*' in rules) {
                processRules(rules['*'], queue, prev, group, this.tokens, this.groups);
              }
            }

            if (prevAtom && (prev.type + '!' in Syntax.Rules)) {
              rules = Syntax.Rules[prev.type + '!'];
              if (group.type in rules) {
                processRules(rules[group.type], queue, prev, group, this.tokens, this.groups);
              }

              if (groupAtom && (group.type + '!' in rules)) {
                processRules(rules[group.type + '!'], queue, prev, group, this.tokens, this.groups);
              }

              if ('*' in rules) {
                processRules(rules['*'], queue, prev, group, this.tokens, this.groups);
              }
            }

            // All non-specific rules
            if ('*' in Syntax.Rules) {
              rules = Syntax.Rules['*'];
              if (group.type in rules) {
                processRules(rules[group.type], queue, prev, group, this.tokens, this.groups);
              }

              if (groupAtom && (group.type + '!' in rules)) {
                processRules(rules[group.type + '!'], queue, prev, group, this.tokens, this.groups);
              }

              if ('*' in rules) {
                processRules(rules['*'], queue, prev, group, this.tokens, this.groups);
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
  var addRule = Syntax.addRule = function(typesLeft, typesRight, rule) {
    if (!rule) {
      rule = typesRight;
      typesRight = ['*'];

      if (!rule) {
        rule = typesLeft;
        typesLeft = ['*'];
      }
    }
    if (Object.prototype.toString.call(typesLeft) !== '[object Array]') {
      typesLeft = [typesLeft];
    }
    if (Object.prototype.toString.call(typesRight) !== '[object Array]') {
      typesRight = [typesRight];
    }
    for (var i = 0; i < typesLeft.length; i++){
      var typeL = typesLeft[i];
      if (!(typeL in Syntax.Rules)) {
        Syntax.Rules[typeL] = {};
      }
      var rules = Syntax.Rules[typeL];

      for (var j = 0; j < typesRight.length; j++) {
        var typeR = typesRight[j];
        if (!(typeR in rules)) {
          rules[typeR] = [];
        }
        rules[typeR].push(rule);
      }
    }
  }

  // New stuff

  var addRules = Syntax.addRules = function(callback) {
    // Utilities
    // it's easier to bind them to $ and _, for example
    function Group() {
      var list = Array.prototype.slice.call(arguments);
      var tag = {};
      if (typeof list[list.length - 1] != 'string') {
        tag = list.pop();
      }
      return { group: list, tag: tag };
    }
    function Literal() {
      var list = Array.prototype.slice.call(arguments);
      var tag = {};
      if (typeof list[list.length - 1] != 'string') {
        tag = list.pop();
      }
      return { literal: list, tag: tag };
    }
    var rules = callback(Group, Literal);
    console.log(rules.length + ' rules:', rules);
    Syntax.Rules = rules;
  }

  Syntax.random = function(groupName) {
    if (groupName.toUpperCase() == groupName) {
      // A word from dictionary with given POS
      
    }
  }

  Syntax.prototype.done = function() {

  }

  return Syntax;
}));
