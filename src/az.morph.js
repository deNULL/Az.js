//(function() {
  var words,
      probabilities,
      predictionSuffixes = new Array(3),
      prefixes = [ '', 'по', 'наи' ],
      suffixes,
      grammemes,
      paradigms,
      tags,
      defaults = {
        // Замены (работают как в pymorphy2).
        // false, чтобы отключить.
        replacements: { 'е': 'ё' },
        // "Заикание". Устраняет повторения букв (как с дефисом - "не-е-ет", так и без - "нееет").
        // Infinity не ограничивает максимальное число повторений (суммарно во всем слове).
        // 0 или false чтобы отключить.
        stutter: Infinity,
        // Опечатки. Максимальное количество опечаток в слове.
        // Опечаткой считается:
        // - лишняя буква в слове
        // - (пропущенная буква в слове) (TODO: пока не работает)
        // - не та буква в слове (если правильная буква стоит рядом на клавиатуре)
        // - переставленные местами соседние буквы
        // 0 или false чтобы отключить.
        // 'auto':
        // - 0, если слово короче 5 букв
        // - 1, если слово короче 10 букв (но только если не нашлось варианта разбора без опечаток)
        // - 2 в противном случае (но только если не нашлось варианта разбора без опечаток или с 1 опечаткой)
        typos: 0
        // Совместное появление опечаток и "заикания" считается недопустимым (т.к. это приводит к большому числу вариантов, особенно на словах с "заиканием")
      };

  // Взято из https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
  function deepFreeze(obj) {
    if (!('freeze' in Object)) {
      return;
    }

    var propNames = Object.getOwnPropertyNames(obj);
    propNames.forEach(function(name) {
      var prop = obj[name];

      if (typeof prop == 'object' && prop !== null)
        deepFreeze(prop);
    });

    return Object.freeze(obj);
  }

  //
  // Экземпляры Tag могут быть довольно большими, т.к. будут переиспользоваться для всех слов.
  // Однако это приводит к запрету на любые изменения этих экземпляров. В современных браузерах для этого будет использован метод Object.freeze()
  // Каждая граммема хранится внутри тега в нескольких местах:
  //   tag[grammeme] = true | false
  //   tag[parent] = grammeme
  //   tag.stat = [grammeme1, grammeme2, ...] // неизменяемые граммемы
  //   tag.flex = [grammeme1, grammeme2, ...] // изменяемые граммемы
  //
  //
  //   tag.ext[grammemeCyr] = true | false
  //   tag.ext[parentCyr] = grammemeCyr
  //   tag.ext.stat = [grammemeCyr1, grammemeCyr2, ...] // неизменяемые граммемы
  //   tag.ext.flex = [grammemeCyr1, grammemeCyr2, ...] // изменяемые граммемы
  //
  //
  //   Тут grammeme - латинская запись граммемы, grammemeCyr - кириллическая
  //   parent, parentCyr - родительская граммема.
  //
  var Tag = function(str) {
    var par, pair = str.split(' ');
    this.stat = pair[0].split(',');
    for (var i = 0; i < this.stat.length; i++) {
      this[this.stat[i]] = true;
      if (par = grammemes[this.stat[i]].parent) {
        this[par] = this.stat[i];
      }
    }
    this.flex = pair[1] ? pair[1].split(',') : [];
    for (var i = 0; i < this.flex.length; i++) {
      this[this.flex[i]] = true;
      if (par = grammemes[this.flex[i]].parent) {
        this[par] = this.flex[i];
      }
    }
    if ('POST' in this) {
      this.POS = this.POST;
    }
  }
  Tag.prototype.toString = function() {
    return (this.stat.join(',') + ' ' + this.flex.join(',')).trim();
  }
  // Проверяет согласованность с конкретными значениями граммем либо со списком граммем из другого тега (или слова)
  // tag.matches({ 'POS' : 'NOUN', 'GNdr': ['masc', 'neut'] })
  //   Ключи — названия граммем, значения — дочерние граммемы, массивы граммем, либо true/false
  // tag.matches(otherTag, ['POS', 'GNdr'])
  //   Тег (или слово) + список граммем, значения которых у этих двух тегов должны совпадать
  Tag.prototype.matches = function(tag, grammemes) {
    if (!grammemes) {
      // Match to map
      for (var k in tag) {
        if (Object.prototype.toString.call(tag[k]) === '[object Array]') {
          if (!tag[k].indexOf(this[k])) {
            return false;
          }
        } else {
          if (tag[k] != this[k]) {
            return false;
          }
        }
      }
      return true;
    }

    if (tag instanceof Word) {
      tag = tag.tag;
    }

    // Match to another tag
    for (var i = 0; i < grammemes.length; i++) {
      if (tag[grammemes[i]] != this[grammemes[i]]) {
        return false;
      }
    }
    return true;
  }

  var Word = function(val, paradigmIdx, formIdx, stutterCnt, typosCnt) {
    this.val = val;
    this.paradigmIdx = paradigmIdx;
    this.paradigm = paradigms[paradigmIdx];
    var len = this.paradigm.length / 3;
    this.formIdx = formIdx;
    this.tag = tags[this.paradigm[len + formIdx]];
    this.stutterCnt = stutterCnt;
    this.typosCnt = typosCnt;
  }
  // Возвращает основу слова
  Word.prototype.base = function() {
    if (this._base) {
      return this._base;
    }
    var len = this.paradigm.length / 3;
    return this._base = this.val.substring(prefixes[this.paradigm[(len << 1) + this.formIdx]].length, this.val.length - suffixes[this.paradigm[this.formIdx]].length);
  }
  // Приводит к начальной форме. Аргумент keepPOS=true нужен, если требуется не менять часть речи при нормализации (например, не делать из причастия инфинитив).
  // TODO: некоторые смены частей речи, возможно, стоит делать в любом случае (т.к., например, компаративы, краткие формы причастий и прилагательных разделены, инфинитив отделен от глагола)
  Word.prototype.normalize = function(keepPOS) {
    return this.inflect(keepPOS ? { POS: this.tag.POS } : 0);
  }
  // Склоняет/спрягает слово так, чтобы оно соответствовало граммемам другого слова, тега или просто конкретным граммемам (подробнее см. Tag.prototype.matches).
  // Всегда выбирается первый подходящий вариант.
  Word.prototype.inflect = function(tag, grammemes) {
    var len = this.paradigm.length / 3;
    if (!grammemes && typeof tag === 'number') {
      // Inflect to specific formIdx
      return [prefixes[this.paradigm[(len << 1) + tag]] + this.base() + suffixes[this.paradigm[tag]], tags[this.paradigm[len + tag]]];
    }

    for (var formIdx = 0; formIdx < len; formIdx++) {
      if (tags[this.paradigm[len + formIdx]].matches(tag, grammemes)) {
        return [prefixes[this.paradigm[(len << 1) + formIdx]] + this.base() + suffixes[this.paradigm[formIdx]], tags[this.paradigm[len + formIdx]]];
      }
    }

    return false;
  }
  // Аналогично Tag.prototype.matches.
  Word.prototype.matches = function(tag, grammemes) {
    return this.tag.matches(tag, grammemes);
  }
  // Выводит информацию о слове в консоль.
  Word.prototype.log = function() {
    var len = this.paradigm.length / 3;
    console.group(this.val);
    console.log('Stutter?', this.stutterCnt, 'Typos?', this.typosCnt);
    console.log(prefixes[this.paradigm[(len << 1) + this.formIdx]] + '|' + this.base() + '|' + suffixes[this.paradigm[this.formIdx]]);
    console.log(this.tag.ext.toString());
    var norm = this.normalize();
    console.log('=> ', norm[0] + ' (' + norm[1].ext.toString() + ')');
    var norm = this.normalize(true);
    console.log('=> ', norm[0] + ' (' + norm[1].ext.toString() + ')');
    console.groupCollapsed('Все формы: ' + len);
    for (var formIdx = 0; formIdx < len; formIdx++) {
      var form = this.inflect(formIdx);
      console.log(form[0] + ' (' + form[1].ext.toString() + ')');
    }
    console.groupEnd();
    console.groupEnd();
  }

  var Morph = Az.Morph = function(word, config) {
    config = config || defaults;

    for (var k in defaults) {
      if (!(k in config)) {
        config[k] = defaults[k];
      }
    }

    var opts;
    if (config.typos == 'auto') {
      opts = words.findAll(word, config.replacements, config.stutter, 0);
      if (!opts.length && word.length > 4) {
        opts = words.findAll(word, config.replacements, config.stutter, 1);
        if (!opts.length && word.length > 9) {
          opts = words.findAll(word, config.replacements, config.stutter, 2);
        }
      }
    } else {
      opts = words.findAll(word, config.replacements, config.stutter, config.typos);
    }

    var vars = [];
    console.log(opts);
    for (var i = 0; i < opts.length; i++) {
      for (var j = 0; j < opts[i][1].length; j++) {
        var word = new Word(opts[i][0], opts[i][1][j][0], opts[i][1][j][1], opts[i][2], opts[i][3]);
        word.log();
        vars.push(word);
      }
    }
    return vars;
  }

  Az.Morph.setDefaults = function(config) {
    defaults = config;
  }

  Az.Morph.init = function(path, callback) {
    var loading = 0;
    var tagsInt, tagsExt;
    function loaded() {
      if (!--loading) {
        tags = Array(tagsInt.length);
        for (var i = 0; i < tagsInt.length; i++) {
          tags[i] = new Tag(tagsInt[i]);
          tags[i].ext = new Tag(tagsExt[i]);
        }
        tags = deepFreeze(tags);
        callback(Morph);
      }
    }

    loading++;
    Az.DAWG.load(path + '/words.dawg', 'words', function(dawg) {
      words = dawg;
      loaded();
    });

    for (var prefix = 0; prefix < 3; prefix++) {
      (function(prefix) {
        loading++;
        Az.DAWG.load(path + '/prediction-suffixes-' + prefix + '.dawg', 'probs', function(dawg) {
          predictionSuffixes[prefix] = dawg;
          loaded();
        });
      })(prefix);
    }

    loading++;
    Az.DAWG.load(path + '/p_t_given_w.intdawg', 'int', function(dawg) {
      probabilities = dawg;
      loaded();
    });

    loading++;
    Az.load(path + '/grammemes.json', 'json', function(json) {
      grammemes = {};
      for (var i = 0; i < json.length; i++) {
        grammemes[json[i][0]] = grammemes[json[i][2]] = {
          parent: json[i][1],
          internal: json[i][0],
          external: json[i][2],
          externalFull: json[i][3]
        }
      }
      loaded();
    });

    loading++;
    Az.load(path + '/gramtab-opencorpora-int.json', 'json', function(json) {
      tagsInt = json;
      loaded();
    });

    loading++;
    Az.load(path + '/gramtab-opencorpora-ext.json', 'json', function(json) {
      tagsExt = json;
      loaded();
    });

    loading++;
    Az.load(path + '/suffixes.json', 'json', function(json) {
      suffixes = json;
      loaded();
    });

    loading++;
    Az.load(path + '/paradigms.array', 'arraybuffer', function(data) {
      var list = new Uint16Array(data),
          count = list[0],
          pos = 1;

      paradigms = [];
      for (var i = 0; i < count; i++) {
        var size = list[pos++];
        paradigms.push(list.subarray(pos, pos + size));
        pos += size;
      }
      loaded();
    });
  }
//})();