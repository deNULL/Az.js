;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Az = factory()
}(this, function () { 'use strict';

  var Az = {
    load: function(url, responseType, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = responseType;

      xhr.onload = function (e) {
        if (xhr.response) {
          callback && callback(xhr.response);
        }
      };

      xhr.send(null);
    }
  };

  return Az;
}));
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Az.DAWG = factory()
}(this, function () { 'use strict';
  var ROOT = 0,
      MISSING = -1,
      PRECISION_MASK = 0xFFFFFFFF,
      HAS_LEAF_BIT = 1 << 8,
      EXTENSION_BIT = 1 << 9,
      OFFSET_MAX = 1 << 21,
      IS_LEAF_BIT = 1 << 31;

  var CP1251 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16,
    17: 17, 18: 18, 19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24, 25: 25, 26: 26, 27: 27, 28: 28, 29: 29, 30: 30, 31: 31, 32: 32,
    33: 33, 34: 34, 35: 35, 36: 36, 37: 37, 38: 38, 39: 39, 40: 40, 41: 41, 42: 42, 43: 43, 44: 44, 45: 45, 46: 46, 47: 47, 48: 48,
    49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 57: 57, 58: 58, 59: 59, 60: 60, 61: 61, 62: 62, 63: 63, 64: 64,
    65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80,
    81: 81, 82: 82, 83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 91: 91, 92: 92, 93: 93, 94: 94, 95: 95, 96: 96,
    97: 97, 98: 98, 99: 99, 100: 100, 101: 101, 102: 102, 103: 103, 104: 104, 105: 105, 106: 106, 107: 107, 108: 108, 109: 109, 110: 110, 111: 111, 112: 112,
    113: 113, 114: 114, 115: 115, 116: 116, 117: 117, 118: 118, 119: 119, 120: 120, 121: 121, 122: 122, 123: 123, 124: 124, 125: 125, 126: 126, 127: 127,
    1027: 129, 8225: 135, 1046: 198, 8222: 132, 1047: 199, 1168: 165, 1048: 200, 1113: 154, 1049: 201, 1045: 197, 1050: 202, 1028: 170, 160: 160, 1040: 192,
    1051: 203, 164: 164, 166: 166, 167: 167, 169: 169, 171: 171, 172: 172, 173: 173, 174: 174, 1053: 205, 176: 176, 177: 177, 1114: 156, 181: 181, 182: 182,
    183: 183, 8221: 148, 187: 187, 1029: 189, 1056: 208, 1057: 209, 1058: 210, 8364: 136, 1112: 188, 1115: 158, 1059: 211, 1060: 212, 1030: 178, 1061: 213,
    1062: 214, 1063: 215, 1116: 157, 1064: 216, 1065: 217, 1031: 175, 1066: 218, 1067: 219, 1068: 220, 1069: 221, 1070: 222, 1032: 163, 8226: 149, 1071: 223,
    1072: 224, 8482: 153, 1073: 225, 8240: 137, 1118: 162, 1074: 226, 1110: 179, 8230: 133, 1075: 227, 1033: 138, 1076: 228, 1077: 229, 8211: 150, 1078: 230,
    1119: 159, 1079: 231, 1042: 194, 1080: 232, 1034: 140, 1025: 168, 1081: 233, 1082: 234, 8212: 151, 1083: 235, 1169: 180, 1084: 236, 1052: 204, 1085: 237,
    1035: 142, 1086: 238, 1087: 239, 1088: 240, 1089: 241, 1090: 242, 1036: 141, 1041: 193, 1091: 243, 1092: 244, 8224: 134, 1093: 245, 8470: 185, 1094: 246,
    1054: 206, 1095: 247, 1096: 248, 8249: 139, 1097: 249, 1098: 250, 1044: 196, 1099: 251, 1111: 191, 1055: 207, 1100: 252, 1038: 161, 8220: 147, 1101: 253,
    8250: 155, 1102: 254, 8216: 145, 1103: 255, 1043: 195, 1105: 184, 1039: 143, 1026: 128, 1106: 144, 8218: 130, 1107: 131, 8217: 146, 1108: 186, 1109: 190};

  // Based on all common ЙЦУКЕН-keyboards (both Windows and Apple variations)
  var COMMON_TYPOS = {
    'й': 'ёцыф', 'ц': 'йфыву', 'у': 'цывак', 'к': 'увапе', 'е': 'капрн', 'н': 'епрог', 'г': 'нролш', 'ш': 'голдщ', 'щ': 'шлджз', 'з': 'щджэх-', 'х': 'зжэъ-', 'ъ': 'хэ-ё',
    'ф': 'йцычяё', 'ы': 'йцувсчяф', 'в': 'цукамсчы', 'а': 'укепимсв', 'п': 'кенртима', 'р': 'енгоьтип', 'о': 'нгшлбьтр', 'л': 'гшщдюбьо', 'д': 'шщзжюбл', 'ж': 'щзхэюд', 'э': 'зхъжё',
    'ё': 'йфяъэ', 'я': 'ёфыч', 'ч': 'яфывс', 'с': 'чывам', 'м': 'свапи', 'и': 'мапрт', 'т': 'ипроь', 'ь': 'тролб', 'б': 'ьолдю', 'ю': 'блдж',
    '1': 'ёйц', '2': 'йцу', '3': 'цук', '4': 'уке', '5': 'кен', '6': 'енг', '7': 'нгш', '8': 'гшщ', '9': 'шщз', '0': 'щзх-', '-': 'зхъ', '=': '-хъ', '\\': 'ъэ', '.': 'южэ'
  };

  function offset(base) {
    return ((base >> 10) << ((base & EXTENSION_BIT) >> 6)) & PRECISION_MASK;
  }

  function label(base) {
    return base & (IS_LEAF_BIT | 0xFF) & PRECISION_MASK;
  }

  function hasLeaf(base) {
    return (base & HAS_LEAF_BIT & PRECISION_MASK) != 0;
  }

  function value(base) {
    return base & ~IS_LEAF_BIT & PRECISION_MASK;
  }

  var DAWG = function(units, guide, format) {
    this.units = units;
    this.guide = guide;
    this.format = format;
  }

  DAWG.fromArrayBuffer = function(data, format) {
    var dv = new DataView(data),
        unitsLength = dv.getUint32(0, true),
        guideLength = dv.getUint32(unitsLength * 4 + 4, true);
    return new DAWG(
      new Uint32Array(data, 4, unitsLength),
      new Uint8Array(data, unitsLength * 4 + 8, guideLength * 2),
      format);
  }

  DAWG.load = function(url, format, callback) {
    Az.load(url, 'arraybuffer', function(data) {
      callback(DAWG.fromArrayBuffer(data, format));
    });
  }

  DAWG.prototype.followByte = function(c, index) {
    var o = offset(this.units[index]);
    var nextIndex = (index ^ o ^ (c & 0xFF)) & PRECISION_MASK;

    if (label(this.units[nextIndex]) != (c & 0xFF)) {
      return MISSING;
    }

    return nextIndex;
  }

  DAWG.prototype.followString = function(str, index) {
    index = index || ROOT;
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (!(code in CP1251)) {
        return MISSING;
      }
      index = this.followByte(CP1251[code], index);
      if (index == MISSING) {
        return MISSING;
      }
    }
    return index;
  }

  DAWG.prototype.hasValue = function(index) {
    return hasLeaf(this.units[index]);
  }

  DAWG.prototype.value = function(index) {
    var o = offset(this.units[index]);
    var valueIndex = (index ^ o) & PRECISION_MASK;
    return value(this.units[valueIndex]);
  }

  DAWG.prototype.find = function(str) {
    var index = this.followString(str);
    if (index == MISSING) {
        return MISSING;
    }
    if (!this.hasValue(index)) {
        return MISSING;
    }
    return this.value(index);
  }

  DAWG.prototype.iterateAll = function(index) {
    var results = [];
    var stack = [index];
    var key = [];
    var last = ROOT;
    var label;

    while (true) {
      index = stack[stack.length - 1];

      if (last != ROOT) {
        label = this.guide[index << 1];
        if (label) {
          index = this.followByte(label, index);
          if (index == MISSING) {
            return results;
          }
          key.push(label);
          stack.push(index);
        } else {
          do {
            label = this.guide[(index << 1) + 1];
            key.pop();
            stack.pop();
            if (!stack.length) {
              return results;
            }
            index = stack[stack.length - 1];
            if (label) {
              index = this.followByte(label, index);
              if (index == MISSING) {
                return results;
              }
              key.push(label);
              stack.push(index);
            }
          } while (!label);
        }
      }

      while (!this.hasValue(index)) {
        var label = this.guide[index << 1];
        index = this.followByte(label, index);
        if (index == MISSING) {
          return results;
        }
        key.push(label);
        stack.push(index);
      }

      // Only three formats supported
      if (this.format == 'words') {
        results.push([
          ((key[0] ^ 1) << 6) + (key[1] >> 1),
          ((key[2] ^ 1) << 6) + (key[3] >> 1)
        ]);
      } else
      if (this.format == 'probs') {
        results.push([
          ((key[0] ^ 1) << 6) + (key[1] >> 1),
          ((key[2] ^ 1) << 6) + (key[3] >> 1),
          ((key[4] ^ 1) << 6) + (key[5] >> 1)
        ]);
      } else {
        // Raw bytes
        results.push(key.slice());
      }
      last = index;
    }
  }

  // Features:
  //  replaces (е -> ё) (DONE)
  //  stutter (ннет -> нет, гоол -> гол, д-да -> да)
  //  typos (count-limited):
  //    swaps (солво -> слово)
  //    extra letters (свлово -> слово)
  //    missing letters (сово -> слово)
  //    wrong letters (сково -> слово)
  DAWG.prototype.findAll = function(str, replaces, mstutter, mtypos) {
    mtypos = mtypos || 0;
    mstutter = mstutter || 0;
    var results = [],
        prefixes = [['', 0, 0, 0, ROOT]],
        prefix, index, len, code, cur, typos, stutter;

    while (prefixes.length) {
      prefix = prefixes.pop();
      index = prefix[4], stutter = prefix[3], typos = prefix[2], len = prefix[1], prefix = prefix[0];

      // Done
      if (len == str.length) {
        if (this.format == 'int') {
          if (this.hasValue(index)) {
            results.push([prefix, this.value(index)]);
          }
          continue;
        }
        // Find all payloads
        if (this.format == 'words' || this.format == 'probs') {
          index = this.followByte(1, index); // separator
          if (index == MISSING) {
            continue;
          }
        }
        results.push([prefix, this.iterateAll(index), stutter, typos]);
        continue;
      }

      // Follow a replacement path
      if (replaces && str[len] in replaces) {
        code = replaces[str[len]].charCodeAt(0);
        if (code in CP1251) {
          cur = this.followByte(CP1251[code], index);
          if (cur != MISSING) {
            prefixes.push([ prefix + replaces[str[len]], len + 1, typos, stutter, cur ]);
          }
        }
      }

      // Follow typos path (if not over limit)
      if (typos < mtypos && !stutter) {
        // Skip a letter entirely (extra letter)
        prefixes.push([ prefix, len + 1, typos + 1, stutter, index ]);

        // Add a letter (missing) - or - replace a letter
        // TODO: iterate all childs?
        // Now it checks only most probable typos (located near to each other on keyboards)
        var possible = COMMON_TYPOS[str[len]];
        if (possible) {
          for (var i = 0; i < possible.length; i++) {
            code = possible.charCodeAt(i);
            if (code in CP1251) {
              cur = this.followByte(CP1251[code], index);
              if (cur != MISSING) {
                // for missing letter we need to iterate all childs, not only COMMON_TYPOS
                // prefixes.push([ prefix + possible[i], len, typos + 1, stutter, cur ]);
                prefixes.push([ prefix + possible[i], len + 1, typos + 1, stutter, cur ]);
              }
            }
          }
        }

        // Swapped two letters
        // TODO: support for replacements?
        if (len < str.length - 1) {
          code = str.charCodeAt(len + 1);
          if (code in CP1251) {
            cur = this.followByte(CP1251[code], index);
            if (cur != MISSING) {
              code = str.charCodeAt(len);
              if (code in CP1251) {
                cur = this.followByte(CP1251[code], cur);
                if (cur != MISSING) {
                  prefixes.push([ prefix + str[len + 1] + str[len], len + 2, typos + 1, stutter, cur ]);
                }
              }
            }
          }
        }
      }

      // Follow base path
      code = str.charCodeAt(len);
      if (code in CP1251) {
        cur = this.followByte(CP1251[code], index);
        if (cur != MISSING) {
          prefixes.push([ prefix + str[len], len + 1, typos, stutter, cur ]);

          while (stutter < mstutter && !typos && len < str.length - 1) {
            // Follow a simple stutter path (merge two equal letters into one)
            if (str[len] == str[len + 1]) {
              prefixes.push([ prefix + str[len], len + 2, typos, stutter + 1, cur ]);
              len++;
            } else
            // Follow a stutter with a dash (д-да)
            if (len < str.length - 2 && str[len + 1] == '-' && str[len] == str[len + 2]) {
              prefixes.push([ prefix + str[len], len + 3, typos, stutter + 1, cur ]);
              len += 2;
            } else {
              break;
            }
            stutter++;
          }
        }
      }
    }
    return results;
  }

  return DAWG;
}));
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Az.Morph = factory()
}(this, function () { 'use strict';
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

  var Morph = function(word, config) {
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
    //console.log(opts);
    for (var i = 0; i < opts.length; i++) {
      for (var j = 0; j < opts[i][1].length; j++) {
        var word = new Word(opts[i][0], opts[i][1][j][0], opts[i][1][j][1], opts[i][2], opts[i][3]);
        //word.log();
        vars.push(word);
      }
    }
    return vars;
  }

  Morph.setDefaults = function(config) {
    defaults = config;
  }

  Morph.init = function(path, callback) {
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

  return Morph;
}));
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Az.Syntax = factory()
}(this, function () { 'use strict';
  // TBD: Syntax analyzer
  var Syntax = function() {

  }

  return Syntax;
}));
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Az.Tokens = factory()
}(this, function () { 'use strict';
  var TLDs = 'ac|ad|ae|aero|af|ag|ai|al|am|ao|aq|ar|arpa|as|asia|at|au|aw|ax|az|ba|bb|be|bf|bg|bh|bi|biz|bj|bm|bo|br|bs|bt|bv|bw|by|bz|ca|cat|cc|cd|cf|cg|ch|ci|cl|cm|cn|co|com|coop|cr|cu|cv|cw|cx|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|es|et|eu|fi|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|info|int|io|iq|ir|is|it|je|jo|jobs|jp|kg|ki|km|kn|kp|kr|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mn|mo|mobi|mp|mq|mr|ms|mt|mu|museum|mv|mw|mx|my|na|name|nc|ne|net|nf|ng|nl|no|nr|nu|nz|om|org|pa|pe|pf|ph|pk|pl|pm|pn|post|pr|pro|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tr|travel|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|yt|امارات|հայ|বাংলা|бел|中国|中國|الجزائر|مصر|ею|გე|ελ|香港|भारत|بھارت|భారత్|ભારત|ਭਾਰਤ|ভারত|இந்தியா|ایران|ايران|عراق|الاردن|한국|қаз|ලංකා|இலங்கை|المغرب|мкд|мон|澳門|澳门|مليسيا|عمان|پاکستان|پاكستان|فلسطين|срб|рф|قطر|السعودية|السعودیة|السعودیۃ|السعوديه|سودان|新加坡|சிங்கப்பூர்|سورية|سوريا|ไทย|تونس|台灣|台湾|臺灣|укр|اليمن|xxx|zm|aaa|aarp|abarth|abb|abbott|abbvie|abc|able|abogado|abudhabi|academy|accenture|accountant|accountants|aco|active|actor|adac|ads|adult|aeg|aetna|afamilycompany|afl|africa|africamagic|agakhan|agency|aig|aigo|airbus|airforce|airtel|akdn|alfaromeo|alibaba|alipay|allfinanz|allstate|ally|alsace|alstom|americanexpress|americanfamily|amex|amfam|amica|amsterdam|analytics|android|anquan|anz|aol|apartments|app|apple|aquarelle|arab|aramco|archi|army|art|arte|asda|associates|athleta|attorney|auction|audi|audible|audio|auspost|author|auto|autos|avianca|aws|axa|azure|baby|baidu|banamex|bananarepublic|band|bank|bar|barcelona|barclaycard|barclays|barefoot|bargains|baseball|basketball|bauhaus|bayern|bbc|bbt|bbva|bcg|bcn|beats|beauty|beer|bentley|berlin|best|bestbuy|bet|bharti|bible|bid|bike|bing|bingo|bio|black|blackfriday|blanco|blockbuster|blog|bloomberg|blue|bms|bmw|bnl|bnpparibas|boats|boehringer|bofa|bom|bond|boo|book|booking|boots|bosch|bostik|boston|bot|boutique|box|bradesco|bridgestone|broadway|broker|brother|brussels|budapest|bugatti|build|builders|business|buy|buzz|bzh|cab|cafe|cal|call|calvinklein|camera|camp|cancerresearch|canon|capetown|capital|capitalone|car|caravan|cards|care|career|careers|cars|cartier|casa|case|caseih|cash|casino|catering|catholic|cba|cbn|cbre|cbs|ceb|center|ceo|cern|cfa|cfd|chanel|channel|chase|chat|cheap|chintai|chloe|christmas|chrome|chrysler|church|cipriani|circle|cisco|citadel|citi|citic|city|cityeats|claims|cleaning|click|clinic|clinique|clothing|cloud|club|clubmed|coach|codes|coffee|college|cologne|comcast|commbank|community|company|compare|computer|comsec|condos|construction|consulting|contact|contractors|cooking|cookingchannel|cool|corsica|country|coupon|coupons|courses|credit|creditcard|creditunion|cricket|crown|crs|cruise|cruises|csc|cuisinella|cymru|cyou|dabur|dad|dance|date|dating|datsun|day|dclk|dds|deal|dealer|deals|degree|delivery|dell|deloitte|delta|democrat|dental|dentist|desi|design|dev|dhl|diamonds|diet|digital|direct|directory|discount|discover|dish|diy|dnp|docs|dodge|dog|doha|domains|dot|download|drive|dstv|dtv|dubai|duck|dunlop|duns|dupont|durban|dvag|dwg|earth|eat|edeka|education|email|emerck|emerson|energy|engineer|engineering|enterprises|epost|epson|equipment|ericsson|erni|esq|estate|esurance|etisalat|eurovision|eus|events|everbank|exchange|expert|exposed|express|extraspace|fage|fail|fairwinds|faith|family|fan|fans|farm|farmers|fashion|fast|fedex|feedback|ferrari|ferrero|fiat|fidelity|fido|film|final|finance|financial|fire|firestone|firmdale|fish|fishing|fit|fitness|flickr|flights|flir|florist|flowers|flsmidth|fly|foo|foodnetwork|football|ford|forex|forsale|forum|foundation|fox|free|fresenius|frl|frogans|frontdoor|frontier|ftr|fujitsu|fujixerox|fun|fund|furniture|futbol|fyi|gal|gallery|gallo|gallup|game|games|gap|garden|gbiz|gdn|gea|gent|genting|george|ggee|gift|gifts|gives|giving|glade|glass|gle|global|globo|gmail|gmbh|gmo|gmx|godaddy|gold|goldpoint|golf|goo|goodhands|goodyear|goog|google|gop|got|gotv|grainger|graphics|gratis|green|gripe|group|guardian|gucci|guge|guide|guitars|guru|hair|hamburg|hangout|haus|hbo|hdfc|hdfcbank|health|healthcare|help|helsinki|here|hermes|hgtv|hiphop|hisamitsu|hitachi|hiv|hkt|hockey|holdings|holiday|homedepot|homegoods|homes|homesense|honda|honeywell|horse|host|hosting|hot|hoteles|hotmail|house|how|hsbc|htc|hughes|hyatt|hyundai|ibm|icbc|ice|icu|ieee|ifm|iinet|ikano|imamat|imdb|immo|immobilien|industries|infiniti|ing|ink|institute|insurance|insure|intel|international|intuit|investments|ipiranga|irish|iselect|ismaili|ist|istanbul|itau|itv|iveco|iwc|jaguar|java|jcb|jcp|jeep|jetzt|jewelry|jio|jlc|jll|jmp|jnj|joburg|jot|joy|jpmorgan|jprs|juegos|juniper|kaufen|kddi|kerryhotels|kerrylogistics|kerryproperties|kfh|kia|kim|kinder|kindle|kitchen|kiwi|koeln|komatsu|kosher|kpmg|kpn|krd|kred|kuokgroup|kyknet|kyoto|lacaixa|ladbrokes|lamborghini|lamer|lancaster|lancia|lancome|land|landrover|lanxess|lasalle|lat|latino|latrobe|law|lawyer|lds|lease|leclerc|lefrak|legal|lego|lexus|lgbt|liaison|lidl|life|lifeinsurance|lifestyle|lighting|like|lilly|limited|limo|lincoln|linde|link|lipsy|live|living|lixil|loan|loans|locker|locus|loft|lol|london|lotte|lotto|love|lpl|lplfinancial|ltd|ltda|lundbeck|lupin|luxe|luxury|macys|madrid|maif|maison|makeup|man|management|mango|market|marketing|markets|marriott|marshalls|maserati|mattel|mba|mcd|mcdonalds|mckinsey|med|media|meet|melbourne|meme|memorial|men|menu|meo|metlife|miami|microsoft|mini|mint|mit|mitsubishi|mlb|mls|mma|mnet|mobily|moda|moe|moi|mom|monash|money|monster|montblanc|mopar|mormon|mortgage|moscow|moto|motorcycles|mov|movie|movistar|msd|mtn|mtpc|mtr|multichoice|mutual|mutuelle|mzansimagic|nab|nadex|nagoya|naspers|nationwide|natura|navy|nba|nec|netbank|netflix|network|neustar|new|newholland|news|next|nextdirect|nexus|nfl|ngo|nhk|nico|nike|nikon|ninja|nissan|nissay|nokia|northwesternmutual|norton|now|nowruz|nowtv|nra|nrw|ntt|nyc|obi|observer|off|office|okinawa|olayan|olayangroup|oldnavy|ollo|omega|one|ong|onl|online|onyourside|ooo|open|oracle|orange|organic|orientexpress|origins|osaka|otsuka|ott|ovh|page|pamperedchef|panasonic|panerai|paris|pars|partners|parts|party|passagens|pay|payu|pccw|pet|pfizer|pharmacy|philips|photo|photography|photos|physio|piaget|pics|pictet|pictures|pid|pin|ping|pink|pioneer|pizza|place|play|playstation|plumbing|plus|pnc|pohl|poker|politie|porn|pramerica|praxi|press|prime|prod|productions|prof|progressive|promo|properties|property|protection|pru|prudential|pub|pwc|qpon|quebec|quest|qvc|racing|raid|read|realestate|realtor|realty|recipes|red|redstone|redumbrella|rehab|reise|reisen|reit|reliance|ren|rent|rentals|repair|report|republican|rest|restaurant|review|reviews|rexroth|rich|richardli|ricoh|rightathome|ril|rio|rip|rmit|rocher|rocks|rodeo|rogers|room|rsvp|ruhr|run|rwe|ryukyu|saarland|safe|safety|sakura|sale|salon|samsclub|samsung|sandvik|sandvikcoromant|sanofi|sap|sapo|sarl|sas|save|saxo|sbi|sbs|sca|scb|schaeffler|schmidt|scholarships|school|schule|schwarz|science|scjohnson|scor|scot|seat|secure|security|seek|select|sener|services|ses|seven|sew|sex|sexy|sfr|shangrila|sharp|shaw|shell|shia|shiksha|shoes|shopping|shouji|show|showtime|shriram|silk|sina|singles|site|ski|skin|sky|skype|sling|smart|smile|sncf|soccer|social|softbank|software|sohu|solar|solutions|song|sony|soy|space|spiegel|spot|spreadbetting|srl|srt|stada|staples|star|starhub|statebank|statefarm|statoil|stc|stcgroup|stockholm|storage|store|stream|studio|study|style|sucks|supersport|supplies|supply|support|surf|surgery|suzuki|swatch|swiftcover|swiss|sydney|symantec|systems|tab|taipei|talk|taobao|target|tatamotors|tatar|tattoo|tax|taxi|tci|tdk|team|tech|technology|telecity|telefonica|temasek|tennis|teva|thd|theater|theatre|theguardian|tiaa|tickets|tienda|tiffany|tips|tires|tirol|tjmaxx|tjx|tkmaxx|tmall|today|tokyo|tools|top|toray|toshiba|total|tours|town|toyota|toys|trade|trading|training|travelchannel|travelers|travelersinsurance|trust|trv|tube|tui|tunes|tushu|tvs|ubank|ubs|uconnect|unicom|university|uno|uol|ups|vacations|vana|vanguard|vegas|ventures|verisign|versicherung|vet|viajes|video|vig|viking|villas|vin|vip|virgin|visa|vision|vista|vistaprint|viva|vivo|vlaanderen|vodka|volkswagen|volvo|vote|voting|voto|voyage|vuelos|wales|walmart|walter|wang|wanggou|warman|watch|watches|weather|weatherchannel|webcam|weber|website|wed|wedding|weibo|weir|whoswho|wien|wiki|williamhill|win|windows|wine|winners|wme|wolterskluwer|woodside|work|works|world|wow|wtc|wtf|xbox|xerox|xfinity|xihuan|xin|कॉम|セール|佛山|慈善|集团|在线|大众汽车|点看|คอม|八卦|موقع|一号店|公益|公司|香格里拉|网站|移动|我爱你|москва|католик|онлайн|сайт|联通|קום|时尚|微博|淡马锡|ファッション|орг|नेट|ストア|삼성|商标|商店|商城|дети|ポイント|新闻|工行|家電|كوم|中文网|中信|娱乐|谷歌|電訊盈科|购物|クラウド|通販|网店|संगठन|餐厅|网络|ком|诺基亚|食品|飞利浦|手表|手机|ارامكو|العليان|اتصالات|بازار|موبايلي|ابوظبي|كاثوليك|همراه|닷컴|政府|شبكة|بيتك|عرب|机构|组织机构|健康|рус|珠宝|大拿|みんな|グーグル|世界|書籍|网址|닷넷|コム|天主教|游戏|vermögensberater|vermögensberatung|企业|信息|嘉里大酒店|嘉里|广东|政务|xperia|xyz|yachts|yahoo|yamaxun|yandex|yodobashi|yoga|yokohama|you|youtube|yun|zappos|zara|zero|zip|zippo|zone|zuerich'.split('|');
  var defaults = {
    html: false,
    wiki: false,       // TODO: check all cases
    markdown: false,   // TODO: check all cases
    hashtags: true,
    mentions: true,
    emails: true,
    links: {
      protocols: true,
      www: true,
      tlds: {}
    }
  };
  /* TODO: add more named HTML entities */
  var HTML_ENTITIES = { nbsp: ' ', quot: '"', gt: '>', lt: '<', amp: '&' };

  for (var i = 0; i < TLDs.length; i++) {
    defaults.links.tlds[TLDs[i]] = true;
  }

  // Start splitting text into tokens
  // Returns a context, use `done` method to retrieve result
  var Tokens = function(text, config) {
    if (this instanceof Tokens) {
      this.tokens = [];
      this.config = config || defaults;
      this.append(text);
      this.index = -1;
    } else {
      return new Tokens(text);
    }
  }

  // Adds more text content
  Tokens.prototype.append = function(text, config) {
    // TODO: get rid of 's' field (storing a copy of token)
    // st + len + en should be enough (check that they are always correct)
    config = config || this.config;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var code = text.charCodeAt(i);

      var append = false;
      var last = this.tokens.length - 1;
      var token = this.tokens[last];

      if (config.html && ch == ';') {
        // &nbsp;
        if (last > 0 && token.type == 'WORD' && this.tokens[last - 1].s == '&') {
          var name = token.s.toLowerCase();
          if (name in HTML_ENTITIES) {
            ch = HTML_ENTITIES[name];
            code = ch.charCodeAt(0);

            last -= 2;
            token = this.tokens[last];
            this.tokens.length = last + 1;
          }
        } else
        // &x123AF5;
        // &1234;
        if (last > 1 && (token.type == 'NUMBER' || (token.type == 'WORD' && token.s[0] == 'x')) && this.tokens[last - 1].s == '#' && this.tokens[last - 2].s == '&') {
          if (token.s[0] == 'x') {
            code = parseInt(token.s.substr(1), 16);
          } else {
            code = parseInt(token.s, 10);
          }
          ch = String.fromCharCode(code);

          last -= 3;
          token = this.tokens[last];
          this.tokens.length = last + 1;
        }
      }

      var charType = 'OTHER';
      var charUpper = (ch.toLocaleLowerCase() != ch);
      if (code >= 0x0400 && code <= 0x04FF) charType = 'CYRIL';
      if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x024F)) charType = 'LATIN';
      if (code >= 0x0030 && code <= 0x0039) charType = 'DIGIT';
      if ((code <= 0x0020) || (code >= 0x0080 && code <= 0x00A0)) charType = 'SPACE';
      if ('‐-−‒–—―.…,:;?!¿¡()[]«»"\'’‘’“”/⁄'.indexOf(ch) > -1) charType = 'PUNCT';

      var tokenType = charType;
      var tokenSubType = false;
      if (charType == 'CYRIL' || charType == 'LATIN') {
        tokenType = 'WORD';
        tokenSubType = charType;
      } else
      if (charType == 'DIGIT') {
        tokenType = 'NUMBER';
      }

      var lineStart = !token || token.s[token.s.length - 1] == '\n';

      if (config.wiki) {
        if (lineStart) {
          if (':;*#~|'.indexOf(ch) > -1) {
            tokenType = 'MARKUP';
            tokenSubType = 'NEWLINE';
          }
        }
        if ('={[|]}'.indexOf(ch) > -1) {
          tokenType = 'MARKUP';
        }
      }

      if (config.markdown) {
        if (lineStart) {
          if ('=-#>+-'.indexOf(ch) > -1) {
            tokenType = 'MARKUP';
            tokenSubType = 'NEWLINE';
          }
        }
        if ('[]*~_`\\'.indexOf(ch) > -1) {
          tokenType = 'MARKUP';
        }
      }

      if (token) {
        if (config.wiki && ch != '\'' && token.s == '\'' && last > 0 && this.tokens[last - 1].type == 'WORD') {
          this.tokens[last - 1].s += token.s;
          this.tokens[last - 1].en = token.en;
          this.tokens[last - 1].len += token.len;

          last -= 1;
          this.tokens.length = last + 1;
          token = this.tokens[last];
        }

        // Preprocess last token
        if (config.links && config.links.tlds &&
            charType == 'PUNCT' &&
            this.tokens.length > 2 &&
            this.tokens[last - 2].type == 'WORD' &&
            this.tokens[last - 1].s == '.' &&
            this.tokens[last].type == 'WORD' &&
            this.tokens[last].s in config.links.tlds) {

          // Merge all subdomains
          while (last >= 2 &&
                 this.tokens[last - 2].type == 'WORD' &&
                 (this.tokens[last - 1].s == '.' || this.tokens[last - 1].s == '@' || this.tokens[last - 1].s == ':')) {
            last -= 2;
            token = this.tokens[last];
            token.s += this.tokens[last + 1].s + this.tokens[last + 2].s;
            token.allUpper = token.allUpper && this.tokens[last + 1].allUpper && this.tokens[last + 2].allUpper;
          }

          if (config.emails && token.s.indexOf('@') > -1 && token.s.indexOf(':') == -1) {
            // URL can contain a '@' but in that case it should be in form http://user@site.com or user:pass@site.com
            // So if URL has a '@' but no ':' in it, we assume it's a email
            token.type = 'EMAIL';
          } else {
            token.type = 'LINK';

            if (ch == '/') {
              append = true;
            }
          }
          this.tokens.length = last + 1;
        } else

        // Process next char (start new token or append to the previous one)
        if (token.type == 'LINK') {
          if (charType != 'SPACE' && ch != ',') {
            append = true;
          }
        } else
        if (token.type == 'EMAIL') {
          if (charType == 'CYRIL' || charType == 'LATIN' || ch == '.') {
            append = true;
          }
        } else
        if (token.type == 'HASHTAG' || token.type == 'MENTION') {
          if (charType == 'CYRIL' || charType == 'LATIN' || charType == 'DIGIT' || ch == '_' || (ch == '@' && token.s.indexOf('@') == -1)) {
            append = true;
          }
        } else
        if (token.type == 'TAG' && (token.quote || token.s[token.s.length - 1] != '>')) {
          append = true;
          if (token.quote) {
            if (ch == token.quote && token.s[token.s.length - 1] != '\\') {
              delete token.quote;
            }
          } else
          if (ch == '"' || ch == '\'') {
            token.quote = ch;
          }
        } else
        if (token.type == 'CONTENT') {
          append = true;
          if (token.quote) {
            if (ch == token.quote && token.s[token.s.length - 1] != '\\') {
              delete token.quote;
            }
          } else
          if (ch == '"' || ch == '\'') {
            token.quote = ch;
          } else
          if (ch == '<') {
            append = false;
          }
        } else
        if (token.type == 'TAG' && ch != '<' && token.s.substr(1, 6).toLowerCase() == 'script') {
          tokenType = 'CONTENT';
          tokenSubType = 'SCRIPT';
        } else
        if (token.type == 'TAG' && ch != '<' && token.s.substr(1, 5).toLowerCase() == 'style') {
          tokenType = 'CONTENT';
          tokenSubType = 'STYLE';
        } else
        if (config.html && token.s == '<' && (charType == 'LATIN' || ch == '!' || ch == '/')) {
          append = true;
          token.type = 'TAG';
          if (ch == '!') {
            token.subType = 'COMMENT';
          } else
          if (ch == '/') {
            token.subType = 'CLOSING';
          }
        } else
        if (token.type == 'CONTENT') {
          append = true;
        } else
        if (token.type == 'MARKUP' && token.subType == 'TEMPLATE' && (token.s[token.s.length - 1] != '}' || token.s[token.s.length - 2] != '}')) {
          append = true;
        } else
        if (token.type == 'MARKUP' && token.type == 'LINK' && token.s[token.s.length - 1] != ')') {
          append = true;
        } else
        if (token.type == 'MARKUP' && token.s[0] == '`' && token.subType == 'NEWLINE' && charType == 'LATIN') {
          append = true;
        } else
        if (charType == 'CYRIL' || charType == 'LATIN') {
          if (token.type == 'WORD') {
            append = true;
            token.subType = (token.subType == charType) ? token.subType : 'MIXED';
          } else
          if (token.type == 'NUMBER') { // Digits + ending
            append = true;
            token.subType = (token.subType && token.subType != charType) ? 'MIXED' : charType;
          } else
          if (config.hashtags && token.s == '#') { // Hashtags
            append = true;
            token.type = 'HASHTAG';
          } else
          if (config.mentions && token.s == '@' && (last == 0 || this.tokens[last - 1].type == 'SPACE')) { // Mentions
            append = true;
            token.type = 'MENTION';
          } else
          if (charType == 'LATIN' && (token.s == '\'' || token.s == '’')) {
            append = true;
            token.type = 'WORD';
            token.subType = 'LATIN';
          } else
          if (token.s == '-') { // -цать (?), 3-й
            append = true;

            if (last > 0 && this.tokens[last - 1].type == 'NUMBER') {
              token = this.tokens[last - 1];
              token.s += this.tokens[last].s;

              this.tokens.length -= 1;
            }

            token.type = 'WORD';
            token.subType = charType;
          }
        } else
        if (charType == 'DIGIT') {
          if (token.type == 'WORD') {
            append = true;
            token.subType = 'MIXED';
          } else
          if (token.type == 'NUMBER') {
            append = true;
          } else
          if (token.s == '+' || token.s == '-') {
            append = true;

            if (last > 0 && this.tokens[last - 1].type == 'NUMBER') {
              token = this.tokens[last - 1];
              token.s += this.tokens[last].s;
              token.subType = 'RANGE';

              this.tokens.length -= 1;
            }

            token.type = 'NUMBER';
          } else
          if ((token.s == ',' || token.s == '.') && this.tokens.length > 1 && this.tokens[last - 1].type == 'NUMBER') {
            append = true;

            token = this.tokens[last - 1];
            token.s += this.tokens[last].s;

            this.tokens.length -= 1;
          }
        } else
        if (charType == 'SPACE') {
          if (token.type == 'SPACE') {
            append = true;
          }
        } else
        if (token.type == 'MARKUP' && token.s[0] == ch && '=-~:*#`\'>_'.indexOf(ch) > -1) {
          append = true;
        } else
        if (ch == '.') {
          if (config.links && config.links.www && token.s.toLocaleLowerCase() == 'www') { // Links without protocol but with www
            append = true;
            token.type = 'LINK';
          }
        } else
        if (config.wiki && ch == '\'') {
          if (token.s == '\'') {
            append = true;
            token.type = 'MARKUP';
          } else {
            tokenType = 'PUNCT';
          }
        } else
        if (ch == '-' || ch == '’' || ch == '\'') {
          if (token.type == 'WORD') {
            append = true;
          }
        } else
        if (ch == '/') {
          if (config.links && config.links.protocols &&
              this.tokens.length > 2 &&
              this.tokens[last - 2].type == 'WORD' &&
              this.tokens[last - 2].subType == 'LATIN' &&
              this.tokens[last - 1].s == ':' &&
              this.tokens[last].s == '/') { // Links (with protocols)
            append = true;

            token = this.tokens[last - 2];
            token.s += this.tokens[last - 1].s + this.tokens[last].s;
            token.allUpper = token.allUpper && this.tokens[last - 1].allUpper && this.tokens[last].allUpper;
            token.type = 'LINK';

            this.tokens.length -= 2;
          }
        } else
        if (config.html && ch == ';') {
          if (last > 0 && token.type == 'WORD' && this.tokens[last - 1].s == '&') {
            append = true;

            token = this.tokens[last - 1];
            token.s += this.tokens[last].s;
            token.allUpper = token.allUpper && this.tokens[last - 1].allUpper;
            token.type = 'ENTITY';

            this.tokens.length -= 1;
          } else
          if (last > 1 && (token.type == 'WORD' || token.type == 'NUMBER') && this.tokens[last - 1].s == '#' && this.tokens[last - 2].s == '&') {
            append = true;

            token = this.tokens[last - 2];
            token.s += this.tokens[last - 1].s + this.tokens[last].s;
            token.allUpper = token.allUpper && this.tokens[last - 1].allUpper && this.tokens[last].allUpper;
            token.type = 'ENTITY';

            this.tokens.length -= 2;
          }
        } else
        if (config.markdown && ch == '[' && token.s == '!') {
          append = true;
          token.type = 'MARKUP';
        } else
        if (config.markdown && ch == '(' && token.s == ']') {
          tokenType = 'MARKUP';
          tokenSubType = 'LINK';
        } else
        if (config.wiki && ch == '{' && token.s == '{') {
          append = true;
          token.type = 'MARKUP';
          token.subType = 'TEMPLATE';
        } else
        if (config.wiki && ch == '[' && token.s == '[') {
          append = true;
        } else
        if (config.wiki && ch == ']' && token.s == ']') {
          append = true;
        } else
        if (config.wiki && ch == '|' && !lineStart) {
          var found = -1;
          for (var j = last - 1; j >= 0; j--) {
            if (this.tokens[j].s == '[[') {
              found = j;
              break;
            }
            if (this.tokens[j].s == '|' || this.tokens[j].s.indexOf('\n') > -1) {
              break;
            }
          }
          if (found > -1) {
            append = true;
            for (var j = last - 1; j >= found; j--) {
              token = this.tokens[j];
              token.s += this.tokens[j + 1].s;
              token.allUpper = token.allUpper && this.tokens[j + 1].allUpper;
            }
            last = found;
            this.tokens.length = last + 1;
            token.subType = 'LINK';
          }
        }
      }

      if (append) {
        token.s += ch;
      } else {
        token = {
          type: tokenType,
          s: ch,
          st: i,
          idx: this.tokens.length,

          firstUpper: charUpper,
          allUpper: charUpper,
        }
        if (tokenSubType) {
          token.subType = tokenSubType;
        }
        this.tokens.push(token);
      }
      token.en = i;
      token.length = (token.en - token.st) + 1;
      token.allUpper = token.allUpper && charUpper;
    }
    return this;
  }

  Tokens.prototype.done = function(filter, exclude) {
    // Finalize tokenizing, return list of tokens
    // For now it just returns tokens, in the future there could be some additional work
    if (!filter) {
      return this.tokens;
    }
    var list = [];
    for (var i = 0; i < this.tokens.length; i++) {
      if ((filter.indexOf(this.tokens[i].type) == -1) == exclude) {
        list.push(this.tokens[i]);
      }
    }
    return list;
  }

  Tokens.prototype.countTokens = function(filter, exclude) {
    if (!skipSpace && !skipPunct) {
      return this.tokens.length;
    }
    var count = 0;
    for (var i = 0; i < this.tokens.length; i++) {
      if ((filter.indexOf(this.tokens[i].type) == -1) == exclude) {
        count++;
      }
    }
    return count;
  }

  Tokens.prototype.nextToken = function(moveIndex, filter, exclude) {
    var index = this.index;
    index++;
    while (index < this.tokens.length && filter && (filter.indexOf(this.tokens[index].type) != -1) == exclude) {
      index++;
    }
    if (index < this.tokens.length) {
      if (moveIndex) {
        this.index = index;
      }
      return this.tokens[index];
    }
    return null;
  }

  Tokens.prototype.punctAhead = function() {
    var token = this.nextToken(false, ['SPACE'], true);
    return token && token.type == 'PUNCT' && token;
  }

  Tokens.prototype.prevToken = function(moveIndex, filter, exclude) {
    var index = this.index;
    index--;
    while (index >= 0 && filter && (filter.indexOf(this.tokens[index].type) != -1) == exclude) {
      index--;
    }
    if (index >= 0) {
      if (moveIndex) {
        this.index = index;
      }
      return this.tokens[index];
    }
    return null;
  }

  Tokens.prototype.punctBehind = function() {
    var token = this.prevToken(false, ['SPACE'], true);
    return token && token.type == 'PUNCT' && token;
  }

  Tokens.prototype.hasTokensAhead = function(filter, exclude) {
    return this.nextToken(false, filter, exclude) != null;
  }

  Tokens.prototype.hasTokensBehind = function(filter, exclude) {
    return this.prevToken(false, filter, exclude) != null;
  }

  return Tokens;
}));