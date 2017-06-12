;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az) { 'use strict';
  // TBD: Syntax analyzer
  var defaults = {};

  var SyntaxGroup = function(type, score, st, en, childs, roles, tag) {
    this.type = type;
    this.score = score;
    this.st = st;
    this.en = en;
    this.childs = childs;
    this.roles = roles;
    this.id = [type];
    for (var i = 0; i < childs.length; i++) {
      this.id.push(childs[i].id);
    }
    this.id = '(' + this.id.join('-') + ')';
    if (tag) {
      this.tag = tag;
    }
  }

  /**
   * Проверяет, согласуется ли текущая форма слова с указанной.
   *
   * @param {Tag|Parse|SyntaxGroup} [tag] Тег или другой разбор слова, с которым следует
   *  проверить согласованность.
   * @param {Array|Object} grammemes Граммемы, по которым нужно проверить
   *  согласованность.
   * @returns {boolean} Является ли текущая форма слова согласованной с указанной.
   * @see Tag.matches
   */
  SyntaxGroup.prototype.matches = function(tag, grammemes, ignoreMissing) {
    if (!this.tag) {
      return false;
    }
    return this.tag.matches(tag, grammemes, ignoreMissing);
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
    this.id = _atom_id++;

    /*
    if (this.tag.matches({ POST: ['NOUN'] })) {
      this.type = 'NP';
    } else
    if (this.tag.matches({ POST: ['NUMB', 'NUMR'] })) {
      this.type = 'Number';
    } else {
    */
    this.type = this.tag.POST;
    //}
  }

  AtomicSyntaxGroup.prototype = Object.create(SyntaxGroup.prototype);
  AtomicSyntaxGroup.prototype.constructor = AtomicSyntaxGroup;

  var Rule = function(data) {
    this.template = data.template;
    this.constraints = data.constraints || [];
    this.weight = data.weight === undefined ? 1.0 : data.weight;
    this.produces = data.produces;
  }

  Rule.prototype.produce = function(groups, last) {
    function isApplicable(index) {
      function checkConstraint(constraint, i, j) {
        var groupI = slice[i];
        var groupJ = slice[j];
        if ('match' in constraint) {
          return groupI.matches(groupJ, constraint.match, true);
        } else
        if ('number' in constraint) {
          // TODO
        }
        return false;
      }
      var template = rule.template[index];
      var group = slice[index];
      if ('literal' in template) {
        // _('какой-то', { CAse: 'nomn' }),
        if (!(group instanceof AtomicSyntaxGroup)) {
          return false;
        }
        if (group.morph.normalize() != template.literal) {
          return false;
        }
      } else
      if ('group' in template) {
        // $('NOUN', 'DefNoun', { CAse: 'nomn' })
        if (template.group.indexOf(group.type) == -1) {
          return false;
        }
      } else {
        if (!group.matches(template)) {
          return false;
        }
      }
      if (template.tag !== false) {
        if (!group.tag || !group.tag.matches(template.tag)) {
          return false;
        }
      }

      // Also check constraints preemptively (so we don't have to go deeper when it's not needed)
      for (var i = 0; i < rule.constraints.length; i++) {
        var constraint = rule.constraints[i];
        if ('only' in constraint) {
          if (constraint.only.indexOf(index) == -1) {
            continue;
          }
          for (var j = 0; j < constraint.only.length; j++) {
            // We are moving from right to left, so we'll ignore not yet filled positions
            // (we'll process them later anyway)
            if (constraint.only[j] > index) {
              if (!checkConstraint(constraint, index, constraint.only[j])) {
                return false;
              }
            }
          }
        } else {
          // We can reduce number of checks if we'll guarantee the transitivity of match function (but can we do it?)
          for (var j = index + 1; j < slice.length; j++) {
            if (!checkConstraint(constraint, index, j)) {
              return false;
            }
          }
        }
      }
      return true;
    }
    function produceGroup(schema) {
      var childs = [];
      if ('childs' in schema) {
        for (var i = 0; i < schema.childs.length; i++) {
          if (typeof schema.childs[i] == 'number') {
            childs.push({
              role: schema.roles[i],
              group: slice[schema.childs[i]]
            });
          } else {
            childs.push({
              role: schema.roles[i],
              group: produceGroup(schema.childs[i])
            });
          }
        }
      } else {
        for (var i = 0; i < slice.length; i++) {
          childs.push({
            role: schema.roles[i],
            group: slice[i]
          });
        }
      }
      var roles = [];
      var st = 100000000;
      var en = -100000000;
      var score = rule.weight;
      for (var i = 0; i < childs.length; i++) {
        st = Math.min(st, childs[i].group.st);
        en = Math.max(en, childs[i].group.en);
        score *= childs[i].group.score; // Maybe this needs tweaking
        if (!(childs[i].role in roles)) {
          roles[childs[i].role] = [];
        }
        roles[childs[i].role].push(childs[i].group);
      }
      return new SyntaxGroup(
        rule.produces.type,
        score, st, en, childs, roles,
        rule.produces.tag === undefined ? false : slice[rule.produces.tag].tag);
    }
    function iterateGroups(index, en) {
      if (index >= 0) {
        if (en >= 0) {
          for (var i = 0; i < groups[en].length; i++) {
            // Check if applicable
            slice[index] = groups[en][i];
            if (isApplicable(index)) {
              iterateGroups(index - 1, slice[index].st - 1);
            }
          }
        }
      } else {
        // Slice is now filled, finish the hypothesis
        matches.push(produceGroup(rule.produces));
      }
    }

    var rule = this;
    var matches = [];
    var slice = new Array(rule.template.length);
    slice[slice.length - 1] = last;
    if (isApplicable(slice.length - 1)) {
      iterateGroups(slice.length - 2, last.st - 1);
    }
    return matches;
  }

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
    function filterRules(group) {
      // TODO: rules can be stored in a more optimal way
      // For example, the POS of last group in template can be a key
      // For now, just return every possible rule.
      return Syntax.Rules;
    }
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
      var str = token.toString();

      // Ignore whitespace
      if ((token.type == 'SPACE')/* || (token.type == 'PUNCT')*/ ||
          (!('type' in token) && str.match(/^[\u0000-\u0020\u0080-\u00A0]*$/))) {
        this.groups.push(groups);
        //this.groups.push([]);
        continue;
      }

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

          ngroups.push(group);

          if (group.st == 0) {
            continue;
          }

          var rules = filterRules(group);
          for (var k = 0; k < rules.length; k++) {
            queue = queue.concat(rules[k].produce(this.groups, group));
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
      var tag = false;
      if (typeof list[list.length - 1] != 'string') {
        tag = list.pop();
      }
      return { group: list, tag: tag };
    }
    function Literal() {
      var list = Array.prototype.slice.call(arguments);
      var tag = false;
      if (typeof list[list.length - 1] != 'string') {
        tag = list.pop();
      }
      return { literal: list, tag: tag };
    }
    var rules = callback(Group, Literal);
    for (var i = 0; i < rules.length; i++) {
      rules[i] = new Rule(rules[i]);
    }
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
