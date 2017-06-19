;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az) { 'use strict';
  var initialized, prepCases;
  // TBD: Syntax analyzer
  var Group = function(st, en, tokens, parses, tag, score) {
    this.st = st;
    this.en = en;
    this.length = en - st + 1;
    this.tokens = tokens;
    this.parses = parses;
    this.tag = tag;
    this.score = score;
  }

  Group.fromParse = function(index, token, parse) {
    return new Group(index, index, [token], [parse], parse.tag, parse.score);
  }

  Group.fromGroups = function() {
    var base = arguments[0].clone();
    for (var i = 1; i < arguments.length; i++) {
      base.append(arguments[i]);
    }
    return base;
  }

  Group.prototype.clone = function() {
    // TODO: do smth about extra attrs
    return new Group(this.st, this.en, this.tokens.slice(0), this.parses.slice(0), this.tag, this.score);
  }

  Group.prototype.prepend = function(token, parse) {
    if (token instanceof Group) {
      this.prepend(token.tokens, token.parses);
    } else
    if (token instanceof Array) {
      this.st -= token.length;
      this.length += token.length;
      this.tokens = token.concat(this.tokens);
      this.parses = parse.concat(this.parses);
    } else {
      this.st--;
      this.length++;
      this.tokens.unshift(token);
      this.parses.unshift(parse);
    }
  }

  Group.prototype.shift = function() {
    this.st++;
    this.length--;
    this.tokens.shift();
    this.parses.shift();
  }

  Group.prototype.append = function(token, parse) {
    if (token instanceof Group) {
      this.append(token.tokens, token.parses);
    } else
    if (token instanceof Array) {
      this.en += token.length;
      this.length += token.length;
      this.tokens = this.tokens.concat(token);
      this.parses = this.parses.concat(parse);
    } else {
      this.en++;
      this.length++;
      this.tokens.push(token);
      this.parses.push(parse);
    }
  }

  Group.prototype.pop = function() {
    this.en--;
    this.length--;
    this.tokens.pop();
    this.parses.pop();
  }

  Group.prototype.matches = function() {
    return this.tag.matches.apply(this.tag, arguments);
  }

  Group.prototype.toLowerCase = function() {
    var str = [];
    var en;
    for (var j = 0; j < this.tokens.length; j++) {
      if (j > 0 && this.tokens[j].st > en) {
        str.push(' ');
      }
      str.push(((this.parses[j] || this.tokens[j]) + '').toLocaleLowerCase());
      en = this.tokens[j].st + this.tokens[j].length;
    }
    return str.join('');
  }

  var GroupCollection = function() {
    this.list = [];
    this.starts = {};
    this.ends = {};
  }

  GroupCollection.prototype.add = function(group) {
    this.list.push(group);
    if (!(group.st in this.starts)) {
      this.starts[group.st] = [group];
    } else {
      this.starts[group.st].push(group);
    }
    if (!(group.en in this.ends)) {
      this.ends[group.en] = [group];
    } else {
      this.ends[group.en].push(group);
    }
  }

  GroupCollection.prototype.remove = function(group) {
    var index = this.list.indexOf(group);
    if (index > -1) {
      this.list.splice(index, 1);
      this.starts[group.st].splice(this.starts[group.st].indexOf(group), 1);
      this.ends[group.en].splice(this.ends[group.en].indexOf(group), 1);
    }
  }

  GroupCollection.prototype.merge = function() {
    for (var i = 0; i < arguments.length; i++) {
      var list = arguments[i].list;
      this.list = this.list.concat(list);
      for (var j = 0; j < list.length; j++) {
        var group = list[j];
        if (!(group.st in this.starts)) {
          this.starts[group.st] = [group];
        } else {
          this.starts[group.st].push(group);
        }
        if (!(group.en in this.ends)) {
          this.ends[group.en] = [group];
        } else {
          this.ends[group.en].push(group);
        }
      }
    }
  }

  GroupCollection.prototype.each = GroupCollection.prototype.forEach = function(func) {
    for (var i = 0; i < this.list.length; i++) {
      var result = func(this.list[i], i);
      if (result === false) {
        break;
      }
    }
  }

  GroupCollection.prototype.before = function(index, func) {
    index = (index.st || index) - 1;
    if (index in this.ends) {
      var list = this.ends[index];
      for (var i = 0; i < list.length; i++) {
        var result = func(list[i], i);
        if (result === false) {
          break;
        }
      }
    }
  }

  GroupCollection.prototype.longestBefore = function(index, func) {
    index = (index.st || index) - 1;
    var longest = false;
    if (index in this.ends) {
      var list = this.ends[index];
      for (var i = 0; i < list.length; i++) {
        var result = func ? func(list[i], i) : list[i];
        if (result && (!longest || longest.length < result.length)) {
          longest = result;
        }
      }
    }
    return longest;
  }

  GroupCollection.prototype.after = function(index, func) {
    index = (index.en || index) + 1;
    if (index in this.starts) {
      var list = this.starts[index];
      for (var i = 0; i < list.length; i++) {
        var result = func(list[i], i);
        if (result === false) {
          break;
        }
      }
    }
  }

  GroupCollection.prototype.longestAfter = function(index, func) {
    index = (index.en || index) + 1;
    var longest = false;
    if (index in this.starts) {
      var list = this.starts[index];
      for (var i = 0; i < list.length; i++) {
        var result = func ? func(list[i], i) : list[i];
        if (result && (!longest || longest.length < result.length)) {
          longest = result;
        }
      }
    }
    return longest;
  }

  GroupCollection.each = GroupCollection.forEach = function(array, func) {
    for (var i = 0; i < array.length; i++) {
      array[i].each(func);
    }
  }

  GroupCollection.before = function(array, index, func) {
    for (var i = 0; i < array.length; i++) {
      array[i].before(index, func);
    }
  }

  GroupCollection.longestBefore = function(array, index, func) {
    var longest = false;
    for (var i = 0; i < array.length; i++) {
      var cur = array[i].longestBefore(index, func);
      if (cur && (!longest || longest.length < cur.length)) {
        longest = cur;
      }
    }
    return longest;
  }

  GroupCollection.after = function(array, index, func) {
    for (var i = 0; i < array.length; i++) {
      array[i].after(index, func);
    }
  }

  GroupCollection.longestAfter = function(array, index, func) {
    var longest = false;
    for (var i = 0; i < array.length; i++) {
      var cur = array[i].longestAfter(index, func);
      if (cur && (!longest || longest.length < cur.length)) {
        longest = cur;
      }
    }
    return longest;
  }

  var Syntax = function(tokens, config) {
    if (!(this instanceof Syntax)) {
      return new Syntax(tokens, config);
    }

    function checkQuotes(group) {
      if (group.before || group.after || group.st == 0 || group.en == parses.length - 1) {
        return group;
      }

      var before = tokens[group.st - 1];
      var after = tokens[group.en + 1];
      // Easy stuff
      if ((before == '«' && after == '»') ||
          /*(before == '(' && after == ')') ||*/ // Groups in brackets should be isolated from other groups
          (before == '[' && after == ']')) {
        group.prepend(before, parses[group.st - 1][0]);
        group.append(after, parses[group.en + 1][0]);
        group.before = before;
        group.after = after;
      }

      return group;
    }

    function buildNames(names) {
      var NMs = new GroupCollection();
      GroupCollection.each(names, function(name1, i) {
        if (name1.tag.Name) {
          var nm = name1.clone();
          nm.type = 'NP';
          nm.dets = [];
          nm.noun = name1;
          nm.name = name1;

          GroupCollection.after(names, nm.name, function(name2, j) {
            if (name2.tag.Surn || name2.tag.Patr || name2.tag.Abbr) {
              if (!name1.matches(name2, ['NMbr', 'CAse', 'GNdr'], true)) {
                return;
              }
              nm.append(name2);
              if (name2.tag.Surn) {
                nm.surname = name2;
              } else {
                nm.patronymic = name2;
              }
              return false;
            }
          });
          if (nm.patronymic) {
            GroupCollection.after(names, nm.patronymic, function(name3, j) {
              if (name3.tag.Surn) {
                if (!name1.matches(name3, ['NMbr', 'CAse', 'GNdr'], true)) {
                  return;
                }
                nm.append(name3);
                nm.surname = name3;
                return false;
              }
            });
          }
          if (!nm.surname) {
            GroupCollection.before(names, nm.name, function(name3, j) {
              if (name3.tag.Surn) {
                if (!name1.matches(name3, ['NMbr', 'CAse', 'GNdr'], true)) {
                  return;
                }
                nm.prepend(name3);
                nm.surname = name3;
                return false;
              }
            });
          }

          NMs.add(checkQuotes(nm));
        } else
        if (name1.tag.Surn) {
          var nm = name1.clone();
          nm.type = 'NP';
          nm.dets = [];
          nm.noun = name1;
          nm.surname = name1;
          NMs.add(checkQuotes(nm));
        }
      });
      return NMs;
    }

    // ADJ + ADJ + ... + NOUN = NOUN PHRASE
    function buildNounPhrases(nouns, adjfs, numbs) {
      var NPs = new GroupCollection();
      GroupCollection.each(nouns, function(noun, i) {
        var np = noun.clone();
        np.type = 'NP';
        np.dets = [];
        np.noun = noun;

        var last = noun;
        for (var j = 1; j < 3 && last.st - 1 >= 0; j++) {
          var adj = GroupCollection.longestBefore(adjfs, last, function(adj, k) {
            if ((adj.tag.CONJ && adj.toLowerCase() == 'и') ||
                (!adj.tag.CONJ && adj.matches(noun.tag, ['NMbr', 'GNdr', 'CAse', 'ANim'], true))) {
              return adj;
            }
          });
          if (adj) {
            last = adj;
            np.prepend(adj);
            if (!adj.tag.CONJ) {
              np.dets.unshift(adj);
            }
          } else {
            break;
          }
        }
        if (last.tag.CONJ) {
          np.shift();
        }
        if (last.st - 1 >= 0) {
          var num = GroupCollection.longestBefore(numbs, last);
          if (num) {
            np.prepend(num);
            np.num = num;
          }
        }
        NPs.add(checkQuotes(np));
      });
      return NPs;
    }

    // NP + NP = NP
    function buildPosessives(nouns) {
      var POSSs = new GroupCollection();
      GroupCollection.each(nouns, function(noun, i) {
        if (!noun.matches({ CAse: 'gent' })) {
          return;
        }

        var pnoun = GroupCollection.longestBefore(nouns, noun);
        if (pnoun) {
          var poss = Group.fromGroups(pnoun, noun);
          poss.type = 'NP';
          poss.np = pnoun;
          poss.dep = noun;
          POSSs.add(checkQuotes(poss));
        }
      });
      return POSSs;
    }

    // PREP + NOUN/NP = PREP PHRASE
    function buildPrepPhrases(nouns, preps) {
      var PPs = new GroupCollection();
      GroupCollection.each(preps, function(prep, i) {
        var str = prep.toLowerCase();
        if (!(str in prepCases)) { // This should never happen (as long as 'preps.json' contain actual info)
          return;
        }
        var noun = GroupCollection.longestAfter(nouns, prep, function(noun, j) {
          if (noun.matches({ CAse: prepCases[str] })) {
            return noun;
          }
        });
        if (noun) {
          var pp = noun.clone();
          pp.type = 'PP';
          pp.np = noun;
          pp.prepend(prep);
          pp.prep = prep;
          PPs.add(checkQuotes(pp));
        }
      });
      return PPs;
    }

    // NP + PP = NP
    // PRTF + PP = PRTF
    function buildNounPrepPhrases(nouns, pnouns) {
      var NPs = new GroupCollection();
      GroupCollection.each(pnouns, function(pnoun, i) {
        var noun = GroupCollection.longestBefore(nouns, pnoun);
        if (noun) {
          var np = Group.fromGroups(noun, pnoun);
          np.type = noun.type;
          np.np = noun;
          np.dep = pnoun;
          NPs.add(checkQuotes(np));
        }
      });
      return NPs;
    }

    // PRTF + NOUN/NPRE
    function buildPrtfNounPhrases(prtfs, nouns) {
      var NPs = new GroupCollection();
      GroupCollection.each(prtfs, function(prtf, i) {
        var noun = GroupCollection.longestAfter(nouns, prtf, function(noun) {
          if (prtf.matches(noun.tag, ['NMbr', 'GNdr', 'CAse', 'ANim'], true)) {
            return noun;
          }
        });
        if (noun) {
          var np = prtf.clone();
          np.type = 'NP';
          np.append(noun);
          np.tag = noun.tag;
          np.noun = noun;
          np.dets = [prtf];
          NPs.add(checkQuotes(np));
        }
      });
      return NPs;
    }

    function buildVerbPredicates(verbs, pps) {
      var VPs = new GroupCollection();

      GroupCollection.each(verbs, function(verb) {
        var vp = verb.clone();
        vp.type = 'VP';
        vp.verb = verb;
        vp.pp = [];

        var last = verb;
        while (last) { // Iterate prefixes
          last = GroupCollection.longestBefore(pps, last, function(group) {
            if (group.tag.ADVB) {
              if (vp.advb) {
                return;
              }
            } else
            if (group.tag.PRCL) {
              if (['не', 'якобы'].indexOf(group.toLowerCase()) == -1) {
                return;
              }
            } else
            if (group.tag.INFN) {
              return;
            } else
            if (group.type == 'NP') {
              if (group.tag.nomn && verb.tag.indc) { // Possibly an object
                if (vp.object) {
                  return;
                }
                if (verb.tag.PErs && verb.tag.PErs != '3per') {
                  if (group.tag.PErs != verb.tag.PErs) {
                    return;
                  }
                } else {
                  if (group.tag.PErs && group.tag.PErs != '3per') {
                    return;
                  }
                }
                if (!group.matches(verb.tag, ['GNdr', 'NMbr'], true)) {
                  return;
                }
              } else
              if (group.tag.accs && verb.tag.tran) { // Possibly an subject
                if (vp.subject) {
                  return;
                }
              } else
              if (group.tag.gent || group.tag.datv || group.tag.ablt) {
                if (vp[group.tag.CAse]) {
                  return;
                }
              } else {
                return;
              }
            }
            return group;
          });

          if (last) {
            vp.prepend(last);
            if (last.tag.ADVB) {
              vp.advb = last;
            } else
            if (last.tag.PRCL) { // не
              if (last.tokens[0].toLowerCase() == 'не') {
                vp.negate = !vp.negate;
              }
            } else
            if (last.type == 'NP') {
              if (last.tag.nomn) {
                vp.object = last;
              } else
              if (last.tag.accs) {
                vp.subject = last;
              } else {
                vp[last.tag.CAse] = last;
              }
            } else {
              vp.pp.push(last);
            }
          }
        }

        last = verb;
        while (last) { // Iterate postfixes
          last = GroupCollection.longestAfter(pps, last, function(group) {
            if (group.tag.ADVB) {
              if (vp.advb || group.tag.Ques) {
                return;
              }
            } else
            if (group.tag.PRCL) {
              return;
            } else
            if (group.tag.INFN) {
              if (vp.modal) {
                return;
              }
            } else
            if (group.type == 'NP') {
              if (group.tag.nomn && verb.tag.indc) { // Possibly an object
                if (vp.object) {
                  return;
                }
                if (verb.tag.PErs && verb.tag.PErs != '3per') {
                  if (group.tag.PErs != verb.tag.PErs) {
                    return;
                  }
                } else {
                  if (group.tag.PErs && group.tag.PErs != '3per') {
                    return;
                  }
                }
                if (!group.matches(verb.tag, ['GNdr', 'NMbr'], true)) {
                  return;
                }
              } else
              if (group.tag.accs && verb.tag.tran) { // Possibly an subject
                if (vp.subject) {
                  return;
                }
              } else
              if (group.tag.gent || group.tag.datv || group.tag.ablt) {
                if (vp[group.tag.CAse]) {
                  return;
                }
              } else {
                return;
              }
            }
            return group;
          });

          if (last) {
            vp.append(last);
            if (last.tag.ADVB) {
              vp.advb = last;
            } else
            if (last.tag.INFN) {
              vp.modal = vp.verb;
              vp.verb = last;
            } else
            if (last.type == 'NP') {
              if (last.tag.nomn) {
                vp.object = last;
              } else
              if (last.tag.accs) {
                vp.subject = last;
              } else {
                vp[last.tag.CAse] = last;
              }
            } else {
              vp.pp.push(last);
            }
          }
        }

        VPs.add(checkQuotes(vp));
      })
      return VPs;
    }

    // Syntax.parse STARTS HERE
    var Sn = this;

    //config = config ? Az.extend(this.config, config) : this.config;
    Sn.tokens = tokens = (typeof tokens == 'string') ? Az.Tokens(tokens).done(['SPACE'], true) : tokens;
    Sn.parses = [];

    var genericNoun = new Az.Morph.Tag('NOUN,Fixd,Name,Surn,Geox,Orgn ');
    genericNoun.ext = new Az.Morph.Tag('СУЩ,0,имя,фам,гео,орг ');

    var parses = [];
    for (var i = 0; i < tokens.length; i++) {
      parses.push(Az.Morph(tokens[i].toString(), config));
    }
    var groups = [];
    for (var i = 0; i < tokens.length; i++) {
      var filtered = [];
      for (var j = 0; j < parses[i].length; j++) {
        var parse = parses[i][j];
        var tag = parse.tag;
        if (tag && tag.POS) {
          if (tag.LATN) {
            // TODO: make this better
            parse.tag = genericNoun;
          }
          var group = Group.fromParse(i, tokens[i], parse);

          if (tag.Abbr) {
            if (i == tokens.length - 1 || tokens[i + 1].toString()[0] != '.') {
              continue;
            } else {
              group.append(tokens[i + 1], parses[i + 1][0]);
            }
          } else
          if (tag.PREP) {
            var str = tokens[i].toLowerCase();
            if ((str == 'невзирая' || str == 'несмотря') && (i < tokens.length - 1) && (tokens[i + 1].toString() == 'на')) {
              group.append(tokens[i + 1], parses[i + 1][0]);
              groups.push(group);
              filtered.push(parse);
              Sn.parses.push(filtered);
              i++;
              filtered = [];
              break;
            }
          }

          groups.push(group);
        }
        filtered.push(parse);
      }
      Sn.parses.push(filtered);
    }
    parses = Sn.parses;

    for (var k in Az.Morph.grammemes) {
      if (Az.Morph.grammemes[k].parent == 'POST') {
        var post = Az.Morph.grammemes[k].internal;
        if (post && !(post in Sn)) {
          Sn[post] = new GroupCollection();
        }
      }
    }

    ['NM', 'NP', 'PP', 'VP', 'PNCT', 'NUMB', 'LATN'].forEach(function(name) {
      Sn[name] = new GroupCollection();
    });

    for (var i = 0; i < groups.length; i++) {
      var tag = groups[i].tag;
      Sn[tag.POS].add(checkQuotes(groups[i]));
    }

    // For now, apply just simplest rules

    // TODO: LATN -> NOUN
    // TODO: Names
    var Names = buildNames([Sn.NOUN, Sn.NPRO]);
    Sn.NP.merge(Names);
    Sn.NM.merge(Names);
    // TODO: Dates
    // TODO: Numbers

    // [широком] [значении]
    var Noun1 = buildNounPhrases(
      [Sn.NOUN, Sn.NPRO],
      [Sn.ADJF, Sn.PRTF, Sn.CONJ],
      [Sn.NUMB, Sn.NUMR]
    );
    Sn.NP.merge(Noun1);


    var Poss1 = buildPosessives([Sn.NP]); // [лингвистики] [текста]
    var Poss2 = buildPosessives([Poss1]); // [рамках] [лингвистики текста]
    Sn.NP.merge(Poss1, Poss2);

    var Prep1 = buildPrepPhrases([Sn.NP], [Sn.PREP]);// [в] [рамках лингвистики текста]
    var NounPrep1 = buildNounPrepPhrases([Sn.NP], [Prep1]); // [отношение] [к тексту]
    Sn.PP.merge(Prep1);
    Sn.NP.merge(NounPrep1);

    var Prep2 = buildPrepPhrases([NounPrep1], [Sn.PREP]); // [через] [секунду после запуска]
    var NounPrep2 = buildNounPrepPhrases([Sn.NP], [Prep2]);
    Sn.PP.merge(Prep2);
    Sn.NP.merge(NounPrep2);

    var Prtf = buildNounPrepPhrases([Sn.PRTF], [Sn.PP]);
    var PrtfNoun = buildPrtfNounPhrases([Prtf], [Sn.NP]);
    Sn.PRTF.merge(Prtf);
    Sn.NP.merge(PrtfNoun);

    // Another round of buildNounPhrases?

    var Verb = buildVerbPredicates([Sn.VERB], [Sn.NP, Sn.PP, Sn.INFN, Sn.PRCL, Sn.ADVB]);
    Sn.VP.merge(Verb);
  }

  Syntax.init = function(path, callback) {
    var loading = 0;
    function loaded() {
      if (!--loading) {

        initialized = true;
        callback && callback(null, Syntax);
      }
    }

    if (!callback && typeof path == 'function') {
      callback = path;
      if (typeof __dirname == 'string') {
        path = __dirname + '/../dicts';
      } else {
        path = 'dicts';
      }
    }

    loading++;
    Az.load(path + '/preps.json', 'json', function(err, json) {
      if (err) {
        callback(err);
        return;
      }
      prepCases = json;
      loaded();
    });
  }

  return Syntax;
}));
