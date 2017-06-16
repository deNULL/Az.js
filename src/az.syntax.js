;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az) { 'use strict';
  var initialized, preps;
  // TBD: Syntax analyzer
  var SyntaxGroup = function(st, en, tokens, parses, tag, score) {
    this.st = st;
    this.en = en;
    this.tokens = tokens;
    this.parses = parses;
    this.tag = tag;
    this.score = score;
  }

  SyntaxGroup.fromParse = function(index, token, parse) {
    return new SyntaxGroup(index, index, [token], [parse], parse.tag, parse.score);
  }

  SyntaxGroup.fromGroups = function() {
    var base = arguments[0].clone();
    for (var i = 1; i < arguments.length; i++) {
      base.append(arguments[i]);
    }
    return base;
  }

  SyntaxGroup.prototype.clone = function() {
    // TODO: do smth about extra attrs
    return new SyntaxGroup(this.st, this.en, this.tokens.slice(0), this.parses.slice(0), this.tag, this.score);
  }

  SyntaxGroup.prototype.prepend = function(token, parse) {
    if (token instanceof SyntaxGroup) {
      this.prepend(token.tokens, token.parses);
    } else
    if (token instanceof Array) {
      this.st -= token.length;
      this.tokens = token.concat(this.tokens);
      this.parses = parse.concat(this.parses);
    } else {
      this.st--;
      this.tokens.unshift(token);
      this.parses.unshift(parse);
    }
  }

  SyntaxGroup.prototype.shift = function() {
    this.st++;
    this.tokens.shift();
    this.parses.shift();
  }

  SyntaxGroup.prototype.append = function(token, parse) {
    if (token instanceof SyntaxGroup) {
      this.append(token.tokens, token.parses);
    } else
    if (token instanceof Array) {
      this.en += token.length;
      this.tokens = this.tokens.concat(token);
      this.parses = this.parses.concat(parse);
    } else {
      this.en++;
      this.tokens.push(token);
      this.parses.push(parse);
    }
  }

  SyntaxGroup.prototype.pop = function() {
    this.en--;
    this.tokens.pop();
    this.parses.pop();
  }

  var Syntax = function() {

  }

  function checkQuotes(parses, tokens, group) {
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

  // ADJ + ADJ + ... + NOUN = NOUN PHRASE
  function buildNounPhrases(parses, tokens, nouns) {
    var NPs = [];
    for (var i = 0; i < nouns.length; i++) {
      var noun = nouns[i];
      var np = noun.clone();
      var lastAnd = false;
      np.type = 'NP';
      np.dets = [];
      np.noun = noun;

      for (var j = 1; j < 3 && noun.st - j >= 0; j++) {
        var found = false;
        for (var k = 0; k < parses[noun.st - j].length; k++) {
          var adj = parses[noun.st - j][k];
          if (adj.matches({ POS: ['ADJF', 'PRTF'] }) &&
              adj.matches(noun.tag, ['NMbr', 'GNdr', 'CAse', 'ANim'], true)) {
            found = true;
            lastAnd = false;
            np.prepend(tokens[noun.st - j], adj);
            np.dets.unshift(adj);
            break;
          } else
          if ((j == 2) && (tokens[noun.st - j].toLowerCase() == 'и')) {
            found = true;
            lastAnd = true;
            np.prepend(tokens[noun.st - j], adj);
            break;
          }
        }
        if (!found) {
          break;
        }
      }
      if (lastAnd) {
        np.shift();
      }
      if (noun.st - j >= 0) {
        for (var k = 0; k < parses[noun.st - j].length; k++) {
          var num = parses[noun.st - j][k];
          if (num.matches({ POS: ['NUMB', 'NUMR'] })) {
            np.prepend(tokens[noun.st - j], num);
            np.num = num;
            break;
          }
        }
      }
      NPs.push(checkQuotes(parses, tokens, np));
    }
    return NPs;
  }

  // NP + NP = NP
  function buildPosessives(parses, tokens, NPs) {
    var POSSs = [];
    for (var i = 0; i < NPs.length; i++) {
      var dep = NPs[i];
      if (dep.st == 0 || !dep.tag.matches({ CAse: 'gent' })) {
        continue;
      }
      for (var k = 0; k < NPs.length; k++) {
        var np = NPs[k];
        if (np.en == dep.st - 1) {
          var poss = SyntaxGroup.fromGroups(np, dep);
          poss.type = 'NP';
          poss.np = np;
          poss.dep = dep;
          POSSs.push(checkQuotes(parses, tokens, poss));
        }
      }
    }
    return POSSs;
  }

  // PREP + NOUN/NP = PREP PHRASE
  function buildPrepPhrases(parses, tokens, NPs) {
    var PPs = [];
    for (var i = 0; i < NPs.length; i++) {
      var np = NPs[i];
      if (np.st == 0) {
        continue;
      }
      var str = tokens[np.st - 1].toLowerCase();
      if (!(str in preps)) {
        continue;
      }

      var pp = np.clone();
      pp.type = 'PP';
      pp.np = np;
      for (var k = 0; k < parses[np.st - 1].length; k++) {
        var prep = parses[np.st - 1][k];
        if (prep.tag.PREP && np.tag.matches({ CAse: preps[str] })) {
          pp.prepend(tokens[np.st - 1], prep);
          pp.prep = prep;

          PPs.push(checkQuotes(parses, tokens, pp));
          break;
        }
      }
    }
    return PPs;
  }

  // NP + PP = NP
  // PRTF + PP = PRTF
  function buildNounPrepPhrases(parses, tokens, NPs, PPs) {
    var NPs2 = [];
    for (var i = 0; i < PPs.length; i++) {
      var dep = PPs[i];
      if (dep.st == 0) {
        continue;
      }
      for (var k = 0; k < NPs.length; k++) {
        var np = NPs[k];
        if (np.en == dep.st - 1) {
          var np2 = SyntaxGroup.fromGroups(np, dep);
          np2.type = np.type;
          np2.np = np;
          np2.dep = dep;
          NPs2.push(checkQuotes(parses, tokens, np2));
        }
      }
    }
    return NPs2;
  }

  // PRTF + NOUN/NPRE
  function buildPrtfNounPhrases(parses, tokens, PRTFs) {
    var NPs = [];
    for (var i = 0; i < PRTFs.length; i++) {
      var det = PRTFs[i];
      if (det.en + 1 >= parses.length - 1) {
        continue;
      }

      for (var k = 0; k < parses[det.en + 1].length; k++) {
        var noun = parses[det.en + 1][k];
        if (noun.tag.matches({ POS: ['NOUN', 'NPRO'] }) &&
            det.tag.matches(noun.tag, ['NMbr', 'GNdr', 'CAse', 'ANim'], true)) {
          var np = det.clone();
          np.type = 'NP';
          np.append(tokens[det.en + 1], noun);
          np.tag = noun.tag;
          np.noun = noun;
          np.dets = [det];
          NPs.push(checkQuotes(parses, tokens, np));
        }
      }
    }
    return NPs;
  }

  function buildVerbPredicates(parses, tokens, VERBs, NPPPs) {
    var VPs = [];
    var ends = {};
    var starts = {};
    for (var i = 0; i < NPPPs.length; i++) {
      if (!(NPPPs[i].st in starts)) {
        starts[NPPPs[i].st] = [];
      }
      starts[NPPPs[i].st].push(NPPPs[i]);
      if (!(NPPPs[i].en in ends)) {
        ends[NPPPs[i].en] = [];
      }
      ends[NPPPs[i].en].push(NPPPs[i]);
    }

    for (var i = 0; i < VERBs.length; i++) {
      var verb = VERBs[i];
      var vp = VERBs[i].clone();
      vp.type = 'VP';
      vp.verb = verb;
      vp.pp = [];

      var st = verb.st - 1;
      while (ends[st]) {
        var found = false;
        for (var j = 0; j < ends[st].length; j++) {
          var group = ends[st][j];
          if (group.tag.ADVB) {
            if (vp.advb) {
              continue;
            }
          } else
          if (group.tag.PRCL) {
            if (['не', 'якобы'].indexOf(group.tokens[0].toLowerCase()) == -1) {
              continue;
            }
          } else
          if (group.tag.INFN) {
            continue;
          } else
          if (group.type == 'NP') {
            if (group.tag.nomn && verb.tag.indc) { // Possibly an object
              if (vp.object) {
                continue;
              }
              if (verb.tag.PErs && verb.tag.PErs != '3per') {
                if (group.tag.PErs != verb.tag.PErs) {
                  continue;
                }
              } else {
                if (group.tag.PErs && group.tag.PErs != '3per') {
                  continue;
                }
              }
              if (!group.tag.matches(verb.tag, ['GNdr', 'NMbr'], true)) {
                continue;
              }
            } else
            if (group.tag.accs && verb.tag.tran) { // Possibly an subject
              if (vp.subject) {
                continue;
              }
            } else
            if (group.tag.gent || group.tag.datv || group.tag.ablt) {
              if (vp[group.tag.CAse]) {
                continue;
              }
            } else {
              continue;
            }
          }
          if (!found || found.st > group.st) {
            found = group;
          }
        }
        if (!found) {
          break;
        }

        vp.prepend(found);
        if (found.tag.ADVB) {
          vp.advb = found;
        } else
        if (found.tag.PRCL) { // не
          if (found.tokens[0].toLowerCase() == 'не') {
            vp.negate = !vp.negate;
          }
        } else
        if (found.type == 'NP') {
          if (found.tag.nomn) {
            vp.object = found;
          } else
          if (found.tag.accs) {
            vp.subject = found;
          } else {
            vp[found.tag.CAse] = found;
          }
        } else {
          vp.pp.push(found);
        }
        st = found.st - 1;
      }


      var en = verb.en + 1;
      while (starts[en]) {
        var found = false;
        for (var j = 0; j < starts[en].length; j++) {
          var group = starts[en][j];
          if (group.tag.ADVB) {
            if (vp.advb) {
              continue;
            }
          } else
          if (group.tag.PRCL) {
            continue;
          } else
          if (group.tag.INFN) {
            if (vp.modal) {
              continue;
            }
          } else
          if (group.type == 'NP') {
            if (group.tag.nomn && verb.tag.indc) { // Possibly an object
              if (vp.object) {
                continue;
              }
              if (verb.tag.PErs && verb.tag.PErs != '3per') {
                if (group.tag.PErs != verb.tag.PErs) {
                  continue;
                }
              } else {
                if (group.tag.PErs && group.tag.PErs != '3per') {
                  continue;
                }
              }
              if (!group.tag.matches(verb.tag, ['GNdr', 'NMbr'], true)) {
                continue;
              }
            } else
            if (group.tag.accs && verb.tag.tran) { // Possibly an subject
              if (vp.subject) {
                continue;
              }
            } else
            if (group.tag.gent || group.tag.datv || group.tag.ablt) {
              if (vp[group.tag.CAse]) {
                continue;
              }
            } else {
              continue;
            }
          }
          if (!found || found.en < group.en) {
            found = group;
          }
        }
        if (!found) {
          break;
        }

        vp.append(found);
        if (found.tag.ADVB) {
          vp.advb = found;
        } else
        if (found.tag.INFN) {
          vp.modal = vp.verb;
          vp.verb = found;
        } else
        if (found.type == 'NP') {
          if (found.tag.nomn) {
            vp.object = found;
          } else
          if (found.tag.accs) {
            vp.subject = found;
          } else {
            vp[found.tag.CAse] = found;
          }
        } else {
          vp.pp.push(found);
        }
        en = found.en + 1;
      }

      VPs.push(vp);
    }

    return VPs;
  }


  Syntax.parse = function(tokens, config) {
    //config = config ? Az.extend(this.config, config) : this.config;
    tokens = (typeof tokens == 'string') ? Az.Tokens(tokens).done(['SPACE'], true) : tokens;
    var res = {
      tokens: tokens,
      parses: []
    };

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
          var group = SyntaxGroup.fromParse(i, tokens[i], parse);

          if (tag.Abbr) {
            if (i == tokens.length - 1 || tokens[i + 1].toString()[0] != '.') {
              continue;
            } else {
              group.append(tokens[i + 1], parses[i + 1][0]);
            }
          }

          groups.push(group);
        }
        filtered.push(parse);
      }
      res.parses.push(filtered);
    }
    for (var i = 0; i < groups.length; i++) {
      var tag = groups[i].tag;
      if (!(tag.POS in res)) {
        res[tag.POS] = [];
      }
      res[tag.POS].push(checkQuotes(res.parses, res.tokens, groups[i]));
    }

    // For now, apply just simplest rules

    res.NP = buildNounPhrases(res.parses, res.tokens,
      (res.NOUN || []).concat(res.NPRO || []));

    var NP = buildPosessives(res.parses, res.tokens, res.NP);
    res.NP = res.NP.concat(NP, buildPosessives(res.parses, res.tokens, NP));

    res.PP = buildPrepPhrases(res.parses, res.tokens, res.NP);

    NP = buildNounPrepPhrases(res.parses, res.tokens, res.NP, res.PP);
    res.NP = res.NP.concat(NP);

    var PP = buildPrepPhrases(res.parses, res.tokens, NP);
    NP = buildNounPrepPhrases(res.parses, res.tokens, res.NP, PP);
    res.NP = res.NP.concat(NP);

    var PRTF = buildNounPrepPhrases(res.parses, res.tokens, res.PRTF || [], res.PP);
    res.PRTF = (res.PRTF || []).concat(PRTF);
    res.NP = res.NP.concat(buildPrtfNounPhrases(res.parses, res.tokens, PRTF));

    res.VP = buildVerbPredicates(res.parses, res.tokens,
      res.VERB || [],
      res.NP.concat(res.PP, res.INFN || [], res.PRCL || [], res.ADVB || []));

    return res;
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
      preps = json;
      loaded();
    });
  }

  return Syntax;
}));
