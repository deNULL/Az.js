;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define('Az', factory) :
  global.Az = factory()
}(this, function () { 'use strict';
  /** @namespace Az **/
  if (typeof require != 'undefined' && typeof exports === 'object' && typeof module !== 'undefined') {
    var fs = require('fs');
  }

  var Az = {
    load: function(url, responseType, callback) {
      if (fs) {
        fs.readFile(url, { encoding: responseType == 'json' ? 'utf8' : null }, function (err, data) {
          if (err) {
            callback(err);
            return;
          }

          if (responseType == 'json') {
            callback(null, JSON.parse(data));
          } else
          if (responseType == 'arraybuffer') {
            if (data.buffer) {
              callback(null, data.buffer);
            } else {
              var ab = new ArrayBuffer(data.length);
              var view = new Uint8Array(ab);
              for (var i = 0; i < data.length; ++i) {
                  view[i] = data[i];
              }
              callback(null, ab);
            }
          } else {
            callback(new Error('Unknown responseType'));
          }
        });
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = responseType;

      xhr.onload = function (e) {
        if (xhr.response) {
          callback && callback(null, xhr.response);
        }
      };

      xhr.send(null);
    },
    extend: function() {
      var result = {};
      for (var i = 0; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          result[key] = arguments[i][key];
        }
      }
      return result;
    }
  };

  return Az;
}));

;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.DAWG = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.DAWG', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.DAWG = factory(global.Az))
}(this, function (Az) { 'use strict';
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

  var UCS2 = {};
  for (var k in CP1251) {
    UCS2[CP1251[k]] = String.fromCharCode(k);
    delete UCS2[0];
    delete UCS2[1];
  }

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
    Az.load(url, 'arraybuffer', function(err, data) {
      callback(err, err ? null : DAWG.fromArrayBuffer(data, format));
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
        if (typos < mtypos && !stutter) {
          // Allow missing letter(s) at the very end
          var label = this.guide[index << 1]; // First child
          do {
            cur = this.followByte(label, index);
            if ((cur != MISSING) && (label in UCS2)) {
              prefixes.push([ prefix + UCS2[label], len, typos + 1, stutter, cur ]);
            }
            label = this.guide[(cur << 1) + 1]; // Next child
          } while (cur != MISSING);
        }

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

        // Add a letter (missing)
        // TODO: iterate all childs?
        var label = this.guide[index << 1]; // First child
        do {
          cur = this.followByte(label, index);
          if ((cur != MISSING) && (label in UCS2)) {
            prefixes.push([ prefix + UCS2[label], len, typos + 1, stutter, cur ]);
          }
          label = this.guide[(cur << 1) + 1]; // Next child
        } while (cur != MISSING);

        // Replace a letter
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
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Morph = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Morph', ['Az', 'Az.DAWG'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Morph = factory(global.Az))
}(this, function (Az) { 'use strict';
  /** @namespace Az **/
  var words,
      probabilities,
      predictionSuffixes = new Array(3),
      prefixes = [ '', 'по', 'наи' ],
      suffixes,
      grammemes,
      paradigms,
      tags,
      defaults = {
        ignoreCase: false,
        replacements: { 'е': 'ё' },
        stutter: Infinity,
        typos: 0,
        parsers: [
          // Словарные слова + инициалы
          'Dictionary?', 'AbbrName?', 'AbbrPatronymic',
          // Числа, пунктуация, латиница (по-хорошему, токенизатор не должен эту ерунду сюда пускать)
          'IntNumber', 'RealNumber', 'Punctuation', 'RomanNumber?', 'Latin',
          // Слова с дефисами
          'HyphenParticle', 'HyphenAdverb', 'HyphenWords',
          // Предсказатели по префиксам/суффиксам
          'PrefixKnown', 'PrefixUnknown?', 'SuffixKnown?', 'Abbr'
        ],
        forceParse: false,
        normalizeScore: true
      },
      initials = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ',
      particles = ['-то', '-ка', '-таки', '-де', '-тко', '-тка', '-с', '-ста'],
      knownPrefixes = [
        'авиа', 'авто', 'аква', 'анти', 'анти-', 'антропо', 'архи', 'арт', 'арт-', 'астро', 'аудио', 'аэро',
        'без', 'бес', 'био', 'вело', 'взаимо', 'вне', 'внутри', 'видео', 'вице-', 'вперед', 'впереди',
        'гекто', 'гелио', 'гео', 'гетеро', 'гига', 'гигро', 'гипер', 'гипо', 'гомо',
        'дву', 'двух', 'де', 'дез', 'дека', 'деци', 'дис', 'до', 'евро', 'за', 'зоо', 'интер', 'инфра',
        'квази', 'квази-', 'кило', 'кино', 'контр', 'контр-', 'космо', 'космо-', 'крипто', 'лейб-', 'лже', 'лже-',
        'макро', 'макси', 'макси-', 'мало', 'меж', 'медиа', 'медиа-', 'мега', 'мета', 'мета-', 'метео', 'метро', 'микро',
        'милли', 'мини', 'мини-', 'моно', 'мото', 'много', 'мульти',
        'нано', 'нарко', 'не', 'небез', 'недо', 'нейро', 'нео', 'низко', 'обер-', 'обще', 'одно', 'около', 'орто',
        'палео', 'пан', 'пара', 'пента', 'пере', 'пиро', 'поли', 'полу', 'после', 'пост', 'пост-',
        'порно', 'пра', 'пра-', 'пред', 'пресс-', 'противо', 'противо-', 'прото', 'псевдо', 'псевдо-',
        'радио', 'разно', 'ре', 'ретро', 'ретро-', 'само', 'санти', 'сверх', 'сверх-', 'спец', 'суб', 'супер', 'супер-', 'супра',
        'теле', 'тетра', 'топ-', 'транс', 'транс-', 'ультра', 'унтер-', 'штаб-',
        'экзо', 'эко', 'эндо', 'эконом-', 'экс', 'экс-', 'экстра', 'экстра-', 'электро', 'энерго', 'этно'
      ],
      autoTypos = [4, 9],
      UNKN,
      __init = [],
      initialized = false;

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

  /**
   * Тег. Содержит в себе информацию о конкретной форме слова, но при этом
   * к конкретному слову не привязан. Всевозможные значения тегов переиспользуются
   * для всех разборов слов.
   *
   * Все граммемы навешаны на тег как поля. Если какая-то граммема содержит в себе
   * дочерние граммемы, то значением поля является именно название дочерней
   * граммемы (например, tag.GNdr == 'masc'). В то же время для дочерних граммем
   * значением является просто true (т.е. условие можно писать и просто как
   * if (tag.masc) ...).
   *
   * @property {string[]} stat Полный список неизменяемых граммем.
   * @property {string[]} flex Полный список изменяемых граммем.
   * @property {Tag} ext Копия тега с русскими обозначениями (по версии OpenCorpora).
   */
  var Tag = function(str) {
    var par, pair = str.split(' ');
    this.stat = pair[0].split(',');
    this.flex = pair[1] ? pair[1].split(',') : [];
    for (var j = 0; j < 2; j++) {
      var grams = this[['stat', 'flex'][j]];
      for (var i = 0; i < grams.length; i++) {
        var gram = grams[i];
        this[gram] = true;
        // loc2 -> loct -> CAse
        while (grammemes[gram] && (par = grammemes[gram].parent)) {
          this[par] = gram;
          gram = par;
        }
      }
    }
    if ('POST' in this) {
      this.POS = this.POST;
    }
  }

  /**
   * Возвращает текстовое представление тега.
   *
   * @returns {string} Список неизменяемых граммем через запятую, пробел,
   *  и список изменяемых граммем через запятую.
   */
  Tag.prototype.toString = function() {
    return (this.stat.join(',') + ' ' + this.flex.join(',')).trim();
  }

  /**
   * Проверяет согласованность с конкретными значениями граммем либо со списком
   * граммем из другого тега (или слова).
   *
   * @param {Tag|Parse} [tag] Тег или разбор слова, с которым следует
   *  проверить согласованность.
   * @param {Array|Object} grammemes Граммемы, по которым нужно проверить
   *  согласованность.
   *
   *  Если указан тег (или разбор), то grammemes должен быть массивом тех
   *  граммем, которые у обоих тегов должны совпадать. Например:
   *  tag.matches(otherTag, ['POS', 'GNdr'])
   *
   *  Если тег не указан, а указан массив граммем, то проверяется просто их
   *  наличие. Например, аналог выражения (tag.NOUN && tag.masc):
   *  tag.matches([ 'NOUN', 'masc' ])
   *
   *  Если тег не указан, а указан объект, то ключи в нем — названия граммем,
   *  значения — дочерние граммемы, массивы граммем, либо true/false:
   *  tag.matches({ 'POS' : 'NOUN', 'GNdr': ['masc', 'neut'] })
   * @returns {boolean} Является ли текущий тег согласованным с указанным.
   */
  // TODO: научиться понимать, что некоторые граммемы можно считать эквивалентными при сравнении двух тегов (вариации падежей и т.п.)
  Tag.prototype.matches = function(tag, grammemes) {
    if (!grammemes) {
      if (Object.prototype.toString.call(tag) === '[object Array]') {
        for (var i = 0; i < tag.length; i++) {
          if (!this[tag[i]]) {
            return false;
          }
        }
        return true;
      } else
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

    if (tag instanceof Parse) {
      tag = tag.tag;
    }

    // Match to another tag
    for (var i = 0; i < grammemes.length; i++) {
      if (tag[grammemes[i]] != this[grammemes[i]]) {
        // Special case: tag.CAse
        return false;
      }
    }
    return true;
  }

  Tag.prototype.isProductive = function() {
    return !(this.NUMR || this.NPRO || this.PRED || this.PREP ||
      this.CONJ || this.PRCL || this.INTJ || this.Apro ||
      this.NUMB || this.ROMN || this.LATN || this.PNCT ||
      this.UNKN);
  }

  Tag.prototype.isCapitalized = function() {
    return this.Name || this.Surn || this.Patr || this.Geox || this.Init;
  }

  function makeTag(tagInt, tagExt) {
    var tag = new Tag(tagInt);
    tag.ext = new Tag(tagExt);
    return deepFreeze(tag);
  }

  /**
   * Производит морфологический анализ слова. Возвращает возможные варианты
   * разбора по убыванию их правдоподобности.
   *
   * @playground
   * var Az = require('az');
   * Az.Morph.init(function() {
   *   console.log(Az.Morph('стали'));
   * });
   * @param {string} word Слово, которое следует разобрать.
   * @param {Object} [config] Опции разбора.
   * @param {boolean} [config.ignoreCase=False] Следует ли игнорировать
   *  регистр слов (в основном это означает возможность написания имен собственных и
   *  инициалов с маленькой буквы).
   * @param {Object} [config.replacements={ 'е': 'ё' }] Допустимые замены букв
   *  при поиске слов в словаре. Ключи объекта — заменяемые буквы в разбираемом
   *  слове, соответствующие им значения — буквы в словарных словах, которым
   *  допустимо встречаться вместо заменяемых. По умолчанию буква «е» может
   *  соответствовать букве «ё» в словарных словах.
   * @param {number} [config.stutter=Infinity] «Заикание». Устраняет повторения букв
   *  (как с дефисом - «не-е-ет», так и без - «нееет»).
   *
   *  Infinity не ограничивает максимальное число повторений (суммарно во всем слове).
   *
   *  0 или false чтобы отключить.
   * @param {number|'auto'} [config.typos=0] Опечатки. Максимальное количество
   * опечаток в слове.
   *
   *  Опечаткой считается:
   *  - лишняя буква в слове
   *  - пропущенная буква в слове (TODO: самый медленный тип опечаток, стоит сделать опциональным)
   *  - не та буква в слове (если правильная буква стоит рядом на клавиатуре)
   *  - переставленные местами соседние буквы
   *
   *  0 или false чтобы отключить.
   *
   *  'auto':
   *  - 0, если слово короче 5 букв
   *  - 1, если слово короче 10 букв (но только если не нашлось варианта разбора без опечаток)
   *  - 2 в противном случае (но только если не нашлось варианта разбора без опечаток или с 1 опечаткой)
   * @param {string[]} [config.parsers] Список применяемых парсеров (см. поля
   *  объекта Az.Morph.Parsers) в порядке применения (т.е. стоящие в начале
   *  имеют наивысший приоритет).
   *
   *  Вопросительный знак означает, что данный парсер не терминальный, то есть
   *  варианты собираются до первого терминального парсера. Иными словами, если
   *  мы дошли до какого-то парсера, значит все стоящие перед ним терминальные
   *  парсеры либо не дали результата совсем, либо дали только с опечатками.
   *
   *  (парсер в терминологии pymorphy2 — анализатор)
   * @param {boolean} [config.forceParse=False] Всегда возвращать хотя бы один вариант
   *  разбора (как это делает pymorphy2), даже если совсем ничего не получилось.
   * @returns {Parse[]} Варианты разбора.
   * @memberof Az
   */
  var Morph = function(word, config) {
    if (!initialized) {
      throw new Error('Please call Az.Morph.init() before using this module.');
    }

    config = config ? Az.extend(defaults, config) : defaults;

    var parses = [];
    var matched = false;
    for (var i = 0; i < config.parsers.length; i++) {
      var name = config.parsers[i];
      var terminal = name[name.length - 1] != '?';
      name = terminal ? name : name.slice(0, -1);
      if (name in Morph.Parsers) {
        var vars = Morph.Parsers[name](word, config);
        for (var j = 0; j < vars.length; j++) {
          vars[j].parser = name;
          if (!vars[j].stutterCnt && !vars[j].typosCnt) {
            matched = true;
          }
        }

        parses = parses.concat(vars);
        if (matched && terminal) {
          break;
        }
      } else {
        console.warn('Parser "' + name + '" is not found. Skipping');
      }
    }

    if (!parses.length && config.forceParse) {
      parses.push(new Parse(word.toLocaleLowerCase(), UNKN));
    }

    var total = 0;
    for (var i = 0; i < parses.length; i++) {
      if (parses[i].parser == 'Dictionary') {
        var res = probabilities.findAll(parses[i] + ':' + parses[i].tag);
        if (res && res[0]) {
          parses[i].score = (res[0][1] / 1000000) * getDictionaryScore(parses[i].stutterCnt, parses[i].typosCnt);
          total += parses[i].score;
        }
      }
    }

    // Normalize Dictionary & non-Dictionary scores separately
    if (config.normalizeScore) {
      if (total > 0) {
        for (var i = 0; i < parses.length; i++) {
          if (parses[i].parser == 'Dictionary') {
            parses[i].score /= total;
          }
        }
      }

      total = 0;
      for (var i = 0; i < parses.length; i++) {
        if (parses[i].parser != 'Dictionary') {
          total += parses[i].score;
        }
      }
      if (total > 0) {
        for (var i = 0; i < parses.length; i++) {
          if (parses[i].parser != 'Dictionary') {
            parses[i].score /= total;
          }
        }
      }
    }

    parses.sort(function(e1, e2) {
      return e2.score - e1.score;
    });

    return parses;
  }

  // TODO: вынести парсеры в отдельный файл(ы)?

  Morph.Parsers = {}

  /**
   * Один из возможных вариантов морфологического разбора.
   *
   * @property {string} word Слово в текущей форме (с исправленными ошибками,
   *  если они были)
   * @property {Tag} tag Тег, описывающий текущую форму слова.
   * @property {number} score Число от 0 до 1, соответствующее «уверенности»
   *  в данном разборе (чем оно выше, тем вероятнее данный вариант).
   * @property {number} stutterCnt Число «заиканий», исправленных в слове.
   * @property {number} typosCnt Число опечаток, исправленных в слове.
   */
  var Parse = function(word, tag, score, stutterCnt, typosCnt) {
    this.word = word;
    this.tag = tag;
    this.stutterCnt = stutterCnt || 0;
    this.typosCnt = typosCnt || 0;
    this.score = score || 0;
  }

  /**
   * Приводит слово к его начальной форме.
   *
   * @param {boolean} keepPOS Не менять часть речи при нормализации (например,
   *  не делать из причастия инфинитив).
   * @returns {Parse} Разбор, соответствующий начальной форме или False,
   *  если произвести нормализацию не удалось.
   */
  // TODO: некоторые смены частей речи, возможно, стоит делать в любом случае (т.к., например, компаративы, краткие формы причастий и прилагательных разделены, инфинитив отделен от глагола)
  Parse.prototype.normalize = function(keepPOS) {
    return this.inflect(keepPOS ? { POS: this.tag.POS } : 0);
  }

  /**
   * Приводит слово к указанной форме.
   *
   * @param {Tag|Parse} [tag] Тег или другой разбор слова, с которым следует
   *  согласовать данный.
   * @param {Array|Object} grammemes Граммемы, по которым нужно согласовать слово.
   * @returns {Parse|False} Разбор, соответствующий указанной форме или False,
   *  если произвести согласование не удалось.
   * @see Tag.matches
   */
  Parse.prototype.inflect = function(tag, grammemes) {
    return this;
  }

  /**
   * Приводит слово к форме, согласующейся с указанным числом.
   * Вместо конкретного числа можно указать категорию (согласно http://www.unicode.org/cldr/charts/29/supplemental/language_plural_rules.html).
   *
   * @param {number|string} number Число, с которым нужно согласовать данное слово или категория, описывающая правило построения множественного числа.
   * @returns {Parse|False} Разбор, соответствующий указанному числу или False,
   *  если произвести согласование не удалось.
   */
  Parse.prototype.pluralize = function(number) {
    if (!this.tag.NOUN && !this.tag.ADJF && !this.tag.PRTF) {
      return this;
    }

    if (typeof number == 'number') {
      number = number % 100;
      if ((number % 10 == 0) || (number % 10 > 4) || (number > 4 && number < 21)) {
        number = 'many';
      } else
      if (number % 10 == 1) {
        number = 'one';
      } else {
        number = 'few';
      }
    }

    if (this.tag.NOUN && !this.tag.nomn && !this.tag.accs) {
      return this.inflect([number == 'one' ? 'sing' : 'plur', this.tag.CAse]);
    } else
    if (number == 'one') {
      return this.inflect(['sing', this.tag.nomn ? 'nomn' : 'accs'])
    } else
    if (this.tag.NOUN && (number == 'few')) {
      return this.inflect(['sing', 'gent']);
    } else
    if ((this.tag.ADJF || this.tag.PRTF) && this.tag.femn && (number == 'few')) {
      return this.inflect(['plur', 'nomn']);
    } else {
      return this.inflect(['plur', 'gent']);
    }
  }

  /**
   * Проверяет, согласуется ли текущая форма слова с указанной.
   *
   * @param {Tag|Parse} [tag] Тег или другой разбор слова, с которым следует
   *  проверить согласованность.
   * @param {Array|Object} grammemes Граммемы, по которым нужно проверить
   *  согласованность.
   * @returns {boolean} Является ли текущая форма слова согласованной с указанной.
   * @see Tag.matches
   */
  Parse.prototype.matches = function(tag, grammemes) {
    return this.tag.matches(tag, grammemes);
  }

  /**
   * Возвращает текущую форму слова.
   *
   * @returns {String} Текущая форма слова.
   */
  Parse.prototype.toString = function() {
    return this.word;
  }

  // Выводит информацию о слове в консоль.
  Parse.prototype.log = function() {
    console.group(this.toString());
    console.log('Stutter?', this.stutterCnt, 'Typos?', this.typosCnt);
    console.log(this.tag.ext.toString());
    console.groupEnd();
  }

  function lookup(dawg, word, config) {
    var entries;
    if (config.typos == 'auto') {
      entries = dawg.findAll(word, config.replacements, config.stutter, 0);
      for (var i = 0; i < autoTypos.length && !entries.length && word.length > autoTypos[i]; i++) {
        entries = dawg.findAll(word, config.replacements, config.stutter, i + 1);
      }
    } else {
      entries = dawg.findAll(word, config.replacements, config.stutter, config.typos);
    }
    return entries;
  }

  function getDictionaryScore(stutterCnt, typosCnt) {
    // = 1.0 if no stutter/typos
    // = 0.3 if any number of stutter or 1 typo
    // = 0.09 if 2 typos
    // = 0.027 if 3 typos
    return Math.pow(0.3, Math.min(stutterCnt, 1) + typosCnt);
  }

  var DictionaryParse = function(word, paradigmIdx, formIdx, stutterCnt, typosCnt, prefix, suffix) {
    this.word = word;
    this.paradigmIdx = paradigmIdx;
    this.paradigm = paradigms[paradigmIdx];
    this.formIdx = formIdx;
    this.formCnt = this.paradigm.length / 3;
    this.tag = tags[this.paradigm[this.formCnt + formIdx]];
    this.stutterCnt = stutterCnt || 0;
    this.typosCnt = typosCnt || 0;
    this.score = getDictionaryScore(this.stutterCnt, this.typosCnt);
    this.prefix = prefix || '';
    this.suffix = suffix || '';
  }

  DictionaryParse.prototype = Object.create(Parse.prototype);
  DictionaryParse.prototype.constructor = DictionaryParse;

  // Возвращает основу слова
  DictionaryParse.prototype.base = function() {
    if (this._base) {
      return this._base;
    }
    return (this._base = this.word.substring(
      prefixes[this.paradigm[(this.formCnt << 1) + this.formIdx]].length,
      this.word.length - suffixes[this.paradigm[this.formIdx]].length)
    );
  }

  // Склоняет/спрягает слово так, чтобы оно соответствовало граммемам другого слова, тега или просто конкретным граммемам (подробнее см. Tag.prototype.matches).
  // Всегда выбирается первый подходящий вариант.
  DictionaryParse.prototype.inflect = function(tag, grammemes) {
    if (!grammemes && typeof tag === 'number') {
      // Inflect to specific formIdx
      return new DictionaryParse(
          prefixes[this.paradigm[(this.formCnt << 1) + tag]] +
          this.base() +
          suffixes[this.paradigm[tag]],
        this.paradigmIdx,
        tag, 0, 0, this.prefix, this.suffix
      );
    }

    for (var formIdx = 0; formIdx < this.formCnt; formIdx++) {
      if (tags[this.paradigm[this.formCnt + formIdx]].matches(tag, grammemes)) {
        return new DictionaryParse(
            prefixes[this.paradigm[(this.formCnt << 1) + formIdx]] +
            this.base() +
            suffixes[this.paradigm[formIdx]],
          this.paradigmIdx,
          formIdx, 0, 0, this.prefix, this.suffix
        );
      }
    }

    return false;
  }

  DictionaryParse.prototype.log = function() {
    console.group(this.toString());
    console.log('Stutter?', this.stutterCnt, 'Typos?', this.typosCnt);
    console.log(prefixes[this.paradigm[(this.formCnt << 1) + this.formIdx]] + '|' + this.base() + '|' + suffixes[this.paradigm[this.formIdx]]);
    console.log(this.tag.ext.toString());
    var norm = this.normalize();
    console.log('=> ', norm + ' (' + norm.tag.ext.toString() + ')');
    norm = this.normalize(true);
    console.log('=> ', norm + ' (' + norm.tag.ext.toString() + ')');
    console.groupCollapsed('Все формы: ' + this.formCnt);
    for (var formIdx = 0; formIdx < this.formCnt; formIdx++) {
      var form = this.inflect(formIdx);
      console.log(form + ' (' + form.tag.ext.toString() + ')');
    }
    console.groupEnd();
    console.groupEnd();
  }

  DictionaryParse.prototype.toString = function() {
    if (this.prefix) {
      var pref = prefixes[this.paradigm[(this.formCnt << 1) + this.formIdx]];
      return pref + this.prefix + this.word.substr(pref.length) + this.suffix;
    } else {
      return this.word + this.suffix;
    }
  }

  var CombinedParse = function(left, right) {
    this.left = left;
    this.right = right;
    this.tag = right.tag;
    this.score = left.score * right.score * 0.8;
    this.stutterCnt = left.stutterCnt + right.stutterCnt;
    this.typosCnt = left.typosCnt + right.typosCnt;
    if ('formCnt' in right) {
      this.formCnt = right.formCnt;
    }
  }

  CombinedParse.prototype = Object.create(Parse.prototype);
  CombinedParse.prototype.constructor = CombinedParse;

  CombinedParse.prototype.inflect = function(tag, grammemes) {
    var left, right;

    var right = this.right.inflect(tag, grammemes);
    if (!grammemes && typeof tag === 'number') {
      left = this.left.inflect(right.tag, ['POST', 'NMbr', 'CAse', 'PErs', 'TEns']);
    } else {
      left = this.left.inflect(tag, grammemes);
    }
    if (left && right) {
      return new CombinedParse(left, right);
    } else {
      return false;
    }
  }

  CombinedParse.prototype.toString = function() {
    return this.left.word + '-' + this.right.word;
  }

  __init.push(function() {
    Morph.Parsers.Dictionary = function(word, config) {
      var isCapitalized =
        !config.ignoreCase && word.length &&
        (word[0].toLocaleLowerCase() != word[0]) &&
        (word.substr(1).toLocaleUpperCase() != word.substr(1));
      word = word.toLocaleLowerCase();

      var opts = lookup(words, word, config);

      var vars = [];
      for (var i = 0; i < opts.length; i++) {
        for (var j = 0; j < opts[i][1].length; j++) {
          var w = new DictionaryParse(
            opts[i][0],
            opts[i][1][j][0],
            opts[i][1][j][1],
            opts[i][2],
            opts[i][3]);
          if (config.ignoreCase || !w.tag.isCapitalized() || isCapitalized) {
            vars.push(w);
          }
        }
      }
      return vars;
    }

    var abbrTags = [];
    for (var i = 0; i <= 2; i++) {
      for (var j = 0; j <= 5; j++) {
        for (var k = 0; k <= 1; k++) {
          abbrTags.push(makeTag(
            'NOUN,inan,' + ['masc', 'femn', 'neut'][i] + ',Fixd,Abbr ' + ['sing', 'plur'][k] + ',' + ['nomn', 'gent', 'datv', 'accs', 'ablt', 'loct'][j],
            'СУЩ,неод,' + ['мр', 'жр', 'ср'][i] + ',0,аббр ' + ['ед', 'мн'][k] + ',' + ['им', 'рд', 'дт', 'вн', 'тв', 'пр'][j]
          ));
        }
      }
    }

    // Произвольные аббревиатуры (несклоняемые)
    // ВК, ЖК, ССМО, ОАО, ЛенСпецСМУ
    Morph.Parsers.Abbr = function(word, config) {
      // Однобуквенные считаются инициалами и для них заведены отдельные парсеры
      if (word.length < 2) {
        return [];
      }
      // Дефисов в аббревиатуре быть не должно
      if (word.indexOf('-') > -1) {
        return [];
      }
      // Первая буква должна быть заглавной: сокращения с маленькой буквы (типа iOS) мало распространены
      // Последняя буква должна быть заглавной: иначе сокращение, вероятно, склоняется
      if ((initials.indexOf(word[0]) > -1) && (initials.indexOf(word[word.length - 1]) > -1)) {
        var caps = 0;
        for (var i = 0; i < word.length; i++) {
          if (initials.indexOf(word[i]) > -1) {
            caps++;
          }
        }
        if (caps <= 5) {
          var vars = [];
          for (var i = 0; i < abbrTags.length; i++) {
            var w = new Parse(word, abbrTags[i], 0.5);
            vars.push(w);
          }
          return vars;
        }
      }
      // При игнорировании регистра разбираем только короткие аббревиатуры
      // (и требуем, чтобы каждая буква была «инициалом», т.е. без мягких/твердых знаков)
      if (!config.ignoreCase || (word.length > 5)) {
        return [];
      }
      word = word.toLocaleUpperCase();
      for (var i = 0; i < word.length; i++) {
        if (initials.indexOf(word[i]) == -1) {
          return [];
        }
      }
      var vars = [];
      for (var i = 0; i < abbrTags.length; i++) {
        var w = new Parse(word, abbrTags[i], 0.2);
        vars.push(w);
      }
      return vars;
    }

    var InitialsParser = function(isPatronymic, score) {
      var initialsTags = [];
      for (var i = 0; i <= 1; i++) {
        for (var j = 0; j <= 5; j++) {
          initialsTags.push(makeTag(
            'NOUN,anim,' + ['masc', 'femn'][i] + ',Sgtm,Name,Fixd,Abbr,Init sing,' + ['nomn', 'gent', 'datv', 'accs', 'ablt', 'loct'][j],
            'СУЩ,од,' + ['мр', 'жр'][i] + ',sg,имя,0,аббр,иниц ед,' + ['им', 'рд', 'дт', 'вн', 'тв', 'пр'][j]
          ));
        }
      }
      return function(word, config) {
        if (word.length != 1) {
          return [];
        }
        if (config.ignoreCase) {
          word = word.toLocaleUpperCase();
        }
        if (initials.indexOf(word) == -1) {
          return [];
        }
        var vars = [];
        for (var i = 0; i < initialsTags.length; i++) {
          var w = new Parse(word, initialsTags[i], score);
          vars.push(w);
        }
        return vars;
      }
    }

    Morph.Parsers.AbbrName = InitialsParser(false, 0.1);
    Morph.Parsers.AbbrPatronymic = InitialsParser(true, 0.1);

    var RegexpParser = function(regexp, tag, score) {
      return function(word, config) {
        if (config.ignoreCase) {
          word = word.toLocaleUpperCase();
        }
        if (word.length && word.match(regexp)) {
          return [new Parse(word, tag)];
        } else {
          return [];
        }
      }
    }

    grammemes['NUMB'] = grammemes['ЧИСЛО'] =
    grammemes['ROMN'] = grammemes['РИМ'] =
    grammemes['LATN'] = grammemes['ЛАТ'] =
    grammemes['PNCT'] = grammemes['ЗПР'] =
    grammemes['UNKN'] = grammemes['НЕИЗВ'] =
     { parent: 'POST' };

    Morph.Parsers.IntNumber = RegexpParser(
      /^[−-]?[0-9]+$/,
      makeTag('NUMB,intg', 'ЧИСЛО,цел'), 0.9);

    Morph.Parsers.RealNumber = RegexpParser(
      /^[−-]?([0-9]*[.,][0-9]+)$/,
      makeTag('NUMB,real', 'ЧИСЛО,вещ'), 0.9);

    Morph.Parsers.Punctuation = RegexpParser(
      /^[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+$/,
      makeTag('PNCT', 'ЗПР'), 0.9);

    Morph.Parsers.RomanNumber = RegexpParser(
      /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/,
      makeTag('ROMN', 'РИМ'), 0.9);

    Morph.Parsers.Latin = RegexpParser(
      /[A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u024f]$/,
      makeTag('LATN', 'ЛАТ'), 0.9);

    // слово + частица
    // смотри-ка
    Morph.Parsers.HyphenParticle = function(word, config) {
      word = word.toLocaleLowerCase();

      var vars = [];
      for (var k = 0; k < particles.length; k++) {
        if (word.substr(word.length - particles[k].length) == particles[k]) {
          var base = word.slice(0, -particles[k].length);
          var opts = lookup(words, base, config);

          //console.log(opts);
          for (var i = 0; i < opts.length; i++) {
            for (var j = 0; j < opts[i][1].length; j++) {
              var w = new DictionaryParse(
                opts[i][0],
                opts[i][1][j][0],
                opts[i][1][j][1],
                opts[i][2],
                opts[i][3],
                '', particles[k]);
              w.score *= 0.9;
              vars.push(w);
            }
          }
        }
      }

      return vars;
    }

    var ADVB = makeTag('ADVB', 'Н');

    // 'по-' + прилагательное в дательном падеже
    // по-западному
    Morph.Parsers.HyphenAdverb = function(word, config) {
      word = word.toLocaleLowerCase();

      if ((word.length < 5) || (word.substr(0, 3) != 'по-')) {
        return [];
      }

      var opts = lookup(words, word.substr(3), config);

      var parses = [];
      var used = {};

      for (var i = 0; i < opts.length; i++) {
        if (!used[opts[i][0]]) {
          for (var j = 0; j < opts[i][1].length; j++) {
            var parse = new DictionaryParse(opts[i][0], opts[i][1][j][0], opts[i][1][j][1], opts[i][2], opts[i][3]);
            if (parse.matches(['ADJF', 'sing', 'datv'])) {
              used[opts[i][0]] = true;

              parse = new Parse('по-' + opts[i][0], ADVB, parse.score * 0.9, opts[i][2], opts[i][3]);
              parses.push(parse);
              break;
            }
          }
        }
      }
      return parses;
    }

    // слово + '-' + слово
    // интернет-магазин
    // компания-производитель
    Morph.Parsers.HyphenWords = function(word, config) {
      word = word.toLocaleLowerCase();
      for (var i = 0; i < knownPrefixes.length; i++) {
        if (knownPrefixes[i][knownPrefixes[i].length - 1] == '-' &&
            word.substr(0, knownPrefixes[i].length) == knownPrefixes[i]) {
          return [];
        }
      }
      var parses = [];
      var parts = word.split('-');
      if (parts.length != 2 || !parts[0].length || !parts[1].length) {
        if (parts.length > 2) {
          var end = parts[parts.length - 1];
          var right = Morph.Parsers.Dictionary(end, config);
          for (var j = 0; j < right.length; j++) {
            if (right[j] instanceof DictionaryParse) {
              right[j].score *= 0.2;
              right[j].prefix = word.substr(0, word.length - end.length - 1) + '-';
              parses.push(right[j]);
            }
          }
        }
        return parses;
      }
      var left = Morph.Parsers.Dictionary(parts[0], config);
      var right = Morph.Parsers.Dictionary(parts[1], config);


      // Variable
      for (var i = 0; i < left.length; i++) {
        if (left[i].tag.Abbr) {
          continue;
        }
        for (var j = 0; j < right.length; j++) {
          if (!left[i].matches(right[j], ['POST', 'NMbr', 'CAse', 'PErs', 'TEns'])) {
            continue;
          }
          if (left[i].stutterCnt + right[j].stutterCnt > config.stutter ||
              left[i].typosCnt + right[j].typosCnt > config.typos) {
            continue;
          }
          parses.push(new CombinedParse(left[i], right[j]));
        }
      }
      // Fixed
      for (var j = 0; j < right.length; j++) {
        if (right[j] instanceof DictionaryParse) {
          right[j].score *= 0.3;
          right[j].prefix = parts[0] + '-';
          parses.push(right[j]);
        }
      }

      return parses;
    }


    Morph.Parsers.PrefixKnown = function(word, config) {
      var isCapitalized =
        !config.ignoreCase && word.length &&
        (word[0].toLocaleLowerCase() != word[0]) &&
        (word.substr(1).toLocaleUpperCase() != word.substr(1));
      word = word.toLocaleLowerCase();
      var parses = [];
      for (var i = 0; i < knownPrefixes.length; i++) {
        if (word.length - knownPrefixes[i].length < 3) {
          continue;
        }

        if (word.substr(0, knownPrefixes[i].length) == knownPrefixes[i]) {
          var end = word.substr(knownPrefixes[i].length);
          var right = Morph.Parsers.Dictionary(end, config);
          for (var j = 0; j < right.length; j++) {
            if (!right[j].tag.isProductive()) {
              continue;
            }
            if (!config.ignoreCase && right[j].tag.isCapitalized() && !isCapitalized) {
              continue;
            }
            right[j].score *= 0.7;
            right[j].prefix = knownPrefixes[i];
            parses.push(right[j]);
          }
        }
      }
      return parses;
    }

    Morph.Parsers.PrefixUnknown = function(word, config) {
      var isCapitalized =
        !config.ignoreCase && word.length &&
        (word[0].toLocaleLowerCase() != word[0]) &&
        (word.substr(1).toLocaleUpperCase() != word.substr(1));
      word = word.toLocaleLowerCase();
      var parses = [];
      for (var len = 1; len <= 5; len++) {
        if (word.length - len < 3) {
          break;
        }
        var end = word.substr(len);
        var right = Morph.Parsers.Dictionary(end, config);
        for (var j = 0; j < right.length; j++) {
          if (!right[j].tag.isProductive()) {
            continue;
          }
          if (!config.ignoreCase && right[j].tag.isCapitalized() && !isCapitalized) {
            continue;
          }
          right[j].score *= 0.3;
          right[j].prefix = word.substr(0, len);
          parses.push(right[j]);
        }
      }
      return parses;
    }

    // Отличие от предсказателя по суффиксам в pymorphy2: найдя подходящий суффикс, проверяем ещё и тот, что на символ короче
    Morph.Parsers.SuffixKnown = function(word, config) {
      if (word.length < 4) {
        return [];
      }
      var isCapitalized =
        !config.ignoreCase && word.length &&
        (word[0].toLocaleLowerCase() != word[0]) &&
        (word.substr(1).toLocaleUpperCase() != word.substr(1));
      word = word.toLocaleLowerCase();
      var parses = [];
      var minlen = 1;
      var coeffs = [0, 0.2, 0.3, 0.4, 0.5, 0.6];
      var used = {};
      for (var i = 0; i < prefixes.length; i++) {
        if (prefixes[i].length && (word.substr(0, prefixes[i].length) != prefixes[i])) {
          continue;
        }
        var base = word.substr(prefixes[i].length);
        for (var len = 5; len >= minlen; len--) {
          if (len >= base.length) {
            continue;
          }
          var left = base.substr(0, base.length - len);
          var right = base.substr(base.length - len);
          var entries = predictionSuffixes[i].findAll(right, config.replacements, 0, 0);
          if (!entries) {
            continue;
          }

          var p = [];
          var max = 1;
          for (var j = 0; j < entries.length; j++) {
            var suffix = entries[j][0];
            var stats = entries[j][1];

            for (var k = 0; k < stats.length; k++) {
              var parse = new DictionaryParse(
                prefixes[i] + left + suffix,
                stats[k][1],
                stats[k][2]);
              // Why there is even non-productive forms in suffix DAWGs?
              if (!parse.tag.isProductive()) {
                continue;
              }
              if (!config.ignoreCase && parse.tag.isCapitalized() && !isCapitalized) {
                continue;
              }
              var key = parse.toString() + ':' + stats[k][1] + ':' + stats[k][2];
              if (key in used) {
                continue;
              }
              max = Math.max(max, stats[k][0]);
              parse.score = stats[k][0] * coeffs[len];
              p.push(parse);
              used[key] = true;
            }
          }
          if (p.length > 0) {
            for (var j = 0; j < p.length; j++) {
              p[j].score /= max;
            }
            parses = parses.concat(p);
            // Check also suffixes 1 letter shorter
            minlen = Math.max(len - 1, 1);
          }
        }
      }
      return parses;
    }

    UNKN = makeTag('UNKN', 'НЕИЗВ');
  });

  /**
   * Задает опции морфологического анализатора по умолчанию.
   *
   * @param {Object} config Опции анализатора.
   * @see Morph
   */
  Morph.setDefaults = function(config) {
    defaults = config;
  }

  /**
   * Инициализирует анализатор, загружая необходимые для работы словари из
   * указанной директории. Эту функцию необходимо вызвать (и дождаться
   * срабатывания коллбэка) до любых действий с модулем.
   *
   * @param {string} [path] Директория, содержащая файлы 'words.dawg',
   * 'grammemes.json' и т.д. По умолчанию директория 'dicts' в данном модуле.
   * @param {Function} callback Коллбэк, вызываемый после завершения загрузки
   *  всех словарей.
   */
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
        for (var i = 0; i < __init.length; i++) {
          __init[i]();
        }
        initialized = true;
        callback && callback(null, Morph);
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
    Az.DAWG.load(path + '/words.dawg', 'words', function(err, dawg) {
      if (err) {
        callback(err);
        return;
      }
      words = dawg;
      loaded();
    });

    for (var prefix = 0; prefix < 3; prefix++) {
      (function(prefix) {
        loading++;
        Az.DAWG.load(path + '/prediction-suffixes-' + prefix + '.dawg', 'probs', function(err, dawg) {
          if (err) {
            callback(err);
            return;
          }
          predictionSuffixes[prefix] = dawg;
          loaded();
        });
      })(prefix);
    }

    loading++;
    Az.DAWG.load(path + '/p_t_given_w.intdawg', 'int', function(err, dawg) {
      if (err) {
        callback(err);
        return;
      }
      probabilities = dawg;
      loaded();
    });

    loading++;
    Az.load(path + '/grammemes.json', 'json', function(err, json) {
      if (err) {
        callback(err);
        return;
      }
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
    Az.load(path + '/gramtab-opencorpora-int.json', 'json', function(err, json) {
      if (err) {
        callback(err);
        return;
      }
      tagsInt = json;
      loaded();
    });

    loading++;
    Az.load(path + '/gramtab-opencorpora-ext.json', 'json', function(err, json) {
      if (err) {
        callback(err);
        return;
      }
      tagsExt = json;
      loaded();
    });

    loading++;
    Az.load(path + '/suffixes.json', 'json', function(err, json) {
      if (err) {
        callback(err);
        return;
      }
      suffixes = json;
      loaded();
    });

    loading++;
    Az.load(path + '/paradigms.array', 'arraybuffer', function(err, data) {
      if (err) {
        callback(err);
        return;
      }
      
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
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az) { 'use strict';
  // TBD: Syntax analyzer
  var Syntax = function() {

  }

  return Syntax;
}));
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Tokens = factory()) :
  typeof define === 'function' && define.amd ? define('Az.Tokens', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Tokens = factory())
}(this, function () { 'use strict';
  /** @namespace Az **/
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
      www: false,
      tlds: {}
    }
  };
  /* TODO: add more named HTML entities */
  var HTML_ENTITIES = { nbsp: ' ', quot: '"', gt: '>', lt: '<', amp: '&', ndash: '–' };

  for (var i = 0; i < TLDs.length; i++) {
    defaults.links.tlds[TLDs[i]] = true;
  }

  /**
   * Токен, соответствующий некоторой подстроке в представленном на вход тексте.
   *
   * @constructor
   * @property {string} type Тип токена.
   * @property {string} subType Подтип токена.
   * @property {number} st Индекс первого символа, входящего в токен.
   * @property {number} en Индекс последнего символа, входящего в токен.
   * @property {number} length Длина токена.
   * @property {boolean} firstUpper True, если первый символ токена является заглавной буквой.
   * @property {boolean} allUpper True, если все символы в токене являются заглавными буквами.
   */
  var Token = function(source, st, length, index, firstUpper, allUpper, type, subType) {
    this.source = source;
    this.st = st;
    this.length = length;
    this.index = index;
    this.firstUpper = firstUpper;
    this.allUpper = allUpper;
    this.type = type;
    if (subType) {
      this.subType = subType;
    }
  }
  Token.prototype.toString = function() {
    return (('_str' in this) && (this._str.length == this.length)) ? this._str : (this._str = this.source.substr(this.st, this.length));
  }
  Token.prototype.indexOf = function(str) {
    if (str.length == 1) {
      for (var i = 0; i < this.length; i++) {
        if (this.source[this.st + i] == str) {
          return i;
        }
      }
      return -1;
    }
    return this.toString().indexOf(str);
  }
  Token.prototype.toLowerCase = function() {
    return this.toString().toLocaleLowerCase();
  }
  Token.prototype.isCapitalized = function() {
    return this.firstUpper && !this.allUpper;
  }
  Token.prototype.en = function() {
    return this.st + this.length - 1;
  }

  /**
   * Создает токенизатор текста с заданными опциями.
   *
   * @playground
   * var Az = require('az');
   * var tokens = Az.Tokens('Текст (от лат. textus — «ткань; сплетение, связь, паутина, сочетание») — зафиксированная на каком-либо материальном носителе человеческая мысль; в общем плане связная и полная последовательность символов.');
   * tokens.done();
   * @constructor
   * @param {string} [text] Строка для разбивки на токены.
   * @param {Object} [config] Опции, применяемые при разбивке.
   * @param {boolean} [config.html=False] Распознавать и выделять в отдельные
   *  токены (типа TAG) HTML-теги. Кроме того, содержимое тегов &lt;style&gt;
   *  и &lt;script&gt; будет размечено как единый токен типа CONTENT.
   * @param {boolean} [config.wiki=False] Распознавать и выделять в отдельные
   *  токены элементы вики-разметки.
   * @param {boolean} [config.markdown=False] Распознавать и выделять в отдельные
   *  токены элементы Markdown-разметки.
   * @param {boolean} [config.hashtags=True] Распознавать и выделять в отдельные
   *  токены хэштеги (строки, начинающиеся с символа «#»).
   * @param {boolean} [config.mentions=True] Распознавать и выделять в отдельные
   *  токены упоминания (строки, начинающиеся с символа «@»).
   * @param {boolean} [config.emails=True] Распознавать и выделять в отдельные
   *  токены е-мейлы (нет, распознавание всех корректных по RFC адресов не
   *  гарантируется).
   * @param {Object} [config.links] Настройки распознавания ссылок. False, чтобы
   *  не распознавать ссылки совсем.
   * @param {boolean} [config.links.protocols=True] Распознавать и выделять в отдельные
   *  токены ссылки с указанным протоколом (http://, https:// и вообще любым другим).
   * @param {boolean} [config.links.www=False] Распознавать и выделять в отдельные
   *  токены ссылки, начинающиеся с «www.».
   * @param {Object} [config.links.tlds] Объект, в котором ключами должны быть
   *  домены верхнего уровня, в которых будут распознаваться ссылки. По умолчанию
   *  текущий список всех таких доменов.
   * @memberof Az
   */
  var Tokens = function(text, config) {
    if (this instanceof Tokens) {
      this.tokens = [];
      this.source = '';
      if (typeof text == 'string') {
        this.config = config ? Az.extend(defaults, config) : defaults;
        this.append(text);
      } else {
        this.config = text ? Az.extend(defaults, text) : defaults;
      }
      this.index = -1;
    } else {
      return new Tokens(text, config);
    }
  }

  Tokens.WORD = new String('WORD');
  Tokens.NUMBER = new String('NUMBER');
  Tokens.OTHER = new String('OTHER');
  Tokens.DIGIT = new String('DIGIT');
  Tokens.CYRIL = new String('CYRIL');
  Tokens.LATIN = new String('LATIN');
  Tokens.MIXED = new String('MIXED');
  Tokens.PUNCT = new String('PUNCT');
  Tokens.SPACE = new String('SPACE');
  Tokens.MARKUP = new String('MARKUP');
  Tokens.NEWLINE = new String('NEWLINE');
  Tokens.EMAIL = new String('EMAIL');
  Tokens.LINK = new String('LINK');
  Tokens.HASHTAG = new String('HASHTAG');
  Tokens.MENTION = new String('MENTION');
  Tokens.TAG = new String('TAG');
  Tokens.CONTENT = new String('CONTENT');
  Tokens.SCRIPT = new String('SCRIPT');
  Tokens.STYLE = new String('STYLE');
  Tokens.COMMENT = new String('COMMENT');
  Tokens.CLOSING = new String('CLOSING');
  Tokens.TEMPLATE = new String('TEMPLATE');
  Tokens.RANGE = new String('RANGE');
  Tokens.ENTITY = new String('ENTITY');

  /**
   * Отправляет ещё один кусок текста на токенизацию. Таким образом вполне
   * допустимо обрабатывать большие документы частями, многократно вызывая этот
   * метод. При этом токен может начаться в одной части и продолжиться в
   * следующей (а закончиться в ещё одной).
   *
   * @param {string} text Строка для разбивки на токены.
   * @param {Object} [config] Опции, применяемые при разбивке. Перекрывают
   *  опции, заданные в конструкторе токенизатора.
   * @see Tokens
   */
  Tokens.prototype.append = function(text, config) {
    'use strict';
    // Для производительности:
    // - как можно меньше операций конкатенции/разбивки строк
    // - вместо сравнения всего токена, проверяем соответствующий ему символ в исходной строке
    // - типы токенов - константы в Tokens, формально это строки, но сравниваем через === (как объекты)
    config = config ? Az.extend(this.config, config) : this.config;
    if (config.links && (config.links.tlds === true)) {
      config.links.tlds = defaults.links.tlds;
    }

    var offs = this.source.length;
    this.source += text;
    
    var s = this.source, ts = this.tokens;
    for (var i = offs; i < s.length; i++) {
      var ch = s[i];
      var code = s.charCodeAt(i);

      var append = false;
      var last = ts.length - 1;
      var token = ts[last];
      var st = i;

      if (config.html && (ch == ';')) {
        // &nbsp;
        if ((last > 0) && 
            (token.type === Tokens.WORD) && 
            (ts[last - 1].length == 1) && 
            (s[ts[last - 1].st] == '&')) {
          var name = token.toLowerCase();
          if (name in HTML_ENTITIES) {
            ch = HTML_ENTITIES[name];
            code = ch.charCodeAt(0);

            last -= 2;
            token = ts[last];
            ts.length = last + 1;
          }
        } else
        // &x123AF5;
        // &1234;
        if ((last > 1) && 
            ((token.type === Tokens.NUMBER) || 
             ((token.type === Tokens.WORD) &&
              (s[token.st] == 'x'))) && 
            (ts[last - 1].length == 1) &&
            (s[ts[last - 1].st] == '#') && 
            (ts[last - 1].length == 1) &&
            (s[ts[last - 1].st] == '&')) {
          if (s[token.st] == 'x') {
            code = parseInt(token.toString().substr(1), 16);
          } else {
            code = parseInt(token.toString(), 10);
          }
          ch = String.fromCharCode(code);

          last -= 3;
          token = ts[last];
          ts.length = last + 1;
        }
      }

      var charType = Tokens.OTHER;
      var charUpper = (ch.toLocaleLowerCase() != ch);
      if (code >= 0x0400 && code <= 0x04FF) charType = Tokens.CYRIL;
      if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x024F)) charType = Tokens.LATIN;
      if (code >= 0x0030 && code <= 0x0039) charType = Tokens.DIGIT;
      if ((code <= 0x0020) || (code >= 0x0080 && code <= 0x00A0)) charType = Tokens.SPACE;
      if ('‐-−‒–—―.…,:;?!¿¡()[]«»"\'’‘’“”/⁄'.indexOf(ch) > -1) charType = Tokens.PUNCT;

      var tokenType = charType;
      var tokenSubType = false;
      if (charType === Tokens.CYRIL || charType === Tokens.LATIN) {
        tokenType = Tokens.WORD;
        tokenSubType = charType;
      } else
      if (charType === Tokens.DIGIT) {
        tokenType = Tokens.NUMBER;
      }

      var lineStart = !token || (s[token.st + token.length - 1] == '\n');

      if (config.wiki) {
        if (lineStart) {
          if (':;*#~|'.indexOf(ch) > -1) {
            tokenType = Tokens.MARKUP;
            tokenSubType = Tokens.NEWLINE;
          }
        }
        if ('={[|]}'.indexOf(ch) > -1) {
          tokenType = Tokens.MARKUP;
        }
      }

      if (config.markdown) {
        if (lineStart) {
          if ('=-#>+-'.indexOf(ch) > -1) {
            tokenType = Tokens.MARKUP;
            tokenSubType = Tokens.NEWLINE;
          }
        }
        if ('[]*~_`\\'.indexOf(ch) > -1) {
          tokenType = Tokens.MARKUP;
        }
      }

      if (token) {
        if (config.wiki && 
            (ch != "'") && 
            (token.length == 1) &&
            (s[token.st] == "'") &&
            (last > 0) &&
            (ts[last - 1].type === Tokens.WORD) &&
            (ts[last - 1].subType === Tokens.LATIN)) {
          ts[last - 1].length += token.length;

          last -= 1;
          ts.length = last + 1;
          token = ts[last];
        }

        // Preprocess last token
        if (config.links && 
            config.links.tlds &&
            ((charType === Tokens.PUNCT) || 
             (charType === Tokens.SPACE)) &&
            (ts.length > 2) &&
            (ts[last - 2].type === Tokens.WORD) &&
            (ts[last - 1].length == 1) &&
            (s[ts[last - 1].st] == '.') &&
            (ts[last].type === Tokens.WORD) &&
            (token.toString() in config.links.tlds)) {

          // Merge all subdomains
          while ((last >= 2) &&
                 (ts[last - 2].type === Tokens.WORD) &&
                 (ts[last - 1].length == 1) &&
                 ((s[ts[last - 1].st] == '.') || 
                  (s[ts[last - 1].st] == '@') || 
                  (s[ts[last - 1].st] == ':'))) {
            last -= 2;
            token = ts[last];
            token.length += ts[last + 1].length + ts[last + 2].length;
            token.allUpper = token.allUpper && ts[last + 1].allUpper && ts[last + 2].allUpper;
          }

          if (config.emails && 
              (token.indexOf('@') > -1) && 
              (token.indexOf(':') == -1)) {
            // URL can contain a '@' but in that case it should be in form http://user@site.com or user:pass@site.com
            // So if URL has a '@' but no ':' in it, we assume it's a email
            token.type = Tokens.EMAIL;
          } else {
            token.type = Tokens.LINK;

            if (ch == '/') {
              append = true;
            }
          }
          ts.length = last + 1;
        } else

        // Process next char (start new token or append to the previous one)
        if (token.type === Tokens.LINK) {
          if ((ch == ')') && 
              (last >= 1) && 
              (ts[last - 1].type === Tokens.MARKUP) &&
              (ts[last - 1].length == 1) &&
              (s[ts[last - 1].st] == '(')) {
            tokenType = Tokens.MARKUP;
          } else
          if ((charType !== Tokens.SPACE) && (ch != ',') && (ch != '<')) {
            append = true;
          }
        } else
        if (token.type === Tokens.EMAIL) {
          if ((charType === Tokens.CYRIL) || (charType === Tokens.LATIN) || (ch == '.')) {
            append = true;
          }
        } else
        if ((token.type === Tokens.HASHTAG) || (token.type === Tokens.MENTION)) {
          if ((charType === Tokens.CYRIL) || 
              (charType == Tokens.LATIN) || 
              (charType == Tokens.DIGIT) || 
              (ch == '_') || ((ch == '@') && (token.indexOf('@') == -1))) {
            append = true;
          }
        } else
        if ((token.type === Tokens.TAG) && (token.quote || (s[token.en()] != '>'))) {
          append = true;
          if (token.quote) {
            if ((ch == token.quote) && (s[token.en()] != '\\')) {
              delete token.quote;
            }
          } else
          if ((ch == '"') || (ch == "'")) {
            token.quote = ch;
          }
        } else
        if (token.type === Tokens.CONTENT) {
          append = true;
          if (token.quote) {
            if ((ch == token.quote) && (s[token.en()] != '\\')) {
              delete token.quote;
            }
          } else
          if ((ch == '"') || (ch == "'")) {
            token.quote = ch;
          } else
          if (ch == '>') {
            if ((token.length >= 8) && (token.toString().substr(-8) == '</script')) {
              token.length -= 8;
              st -= 8;

              append = false;
              tokenType = Tokens.TAG;
              tokenSubType = Tokens.CLOSING;
            } else 
            if ((token.length >= 7) && (token.toString().substr(-7) == '</style')) {
              token.length -= 7;
              st -= 7;

              append = false;
              tokenType = Tokens.TAG;
              tokenSubType = Tokens.CLOSING;
            } 
          }
        } else
        if ((token.type === Tokens.TAG) && 
            (token.type !== Tokens.CLOSING) &&
            (token.length >= 8) &&
            (token.toLowerCase().substr(1, 6) == 'script')) {
          tokenType = Tokens.CONTENT;
          tokenSubType = Tokens.SCRIPT;
        } else
        if ((token.type === Tokens.TAG) && 
            (token.type !== Tokens.CLOSING) &&
            (token.length >= 7) && 
            (token.toLowerCase().substr(1, 5) == 'style')) {
          tokenType = Tokens.CONTENT;
          tokenSubType = Tokens.STYLE;
        } else
        if (config.html && 
            (token.length == 1) &&
            (s[token.st] == '<') && 
            ((charType === Tokens.LATIN) || (ch == '!') || (ch == '/'))) {
          append = true;
          token.type = Tokens.TAG;
          if (ch == '!') {
            token.subType = Tokens.COMMENT;
          } else
          if (ch == '/') {
            token.subType = Tokens.CLOSING;
          }
        } else
        if (token.type === Tokens.CONTENT) {
          append = true;
        } else
        if ((token.type === Tokens.MARKUP) && 
            (token.subType == Tokens.TEMPLATE) && 
            ((s[token.en()] != '}') || 
             (s[token.en() - 1] != '}'))) {
          append = true;
        } else
        if ((token.type === Tokens.MARKUP) && 
            (token.type === Tokens.LINK) && 
            (s[token.en()] != ')')) {
          append = true;
        } else
        if ((token.type === Tokens.MARKUP) && 
            (s[token.st] == '`') && 
            (token.subType === Tokens.NEWLINE) &&
            (charType === Tokens.LATIN)) {
          append = true;
        } else
        if ((charType === Tokens.CYRIL) || (charType === Tokens.LATIN)) {
          if (token.type === Tokens.WORD) {
            append = true;
            token.subType = (token.subType == charType) ? token.subType : Tokens.MIXED;
          } else
          if (token.type === Tokens.NUMBER) { // Digits + ending
            append = true;
            token.subType = (token.subType && token.subType != charType) ? Tokens.MIXED : charType;
          } else
          if (config.hashtags && (token.length == 1) && (s[token.st] == '#')) { // Hashtags
            append = true;
            token.type = Tokens.HASHTAG;
          } else
          if (config.mentions && 
              (token.length == 1) && 
              (s[token.st] == '@') && 
              ((last == 0) || (ts[last - 1].type === Tokens.SPACE))) { // Mentions
            append = true;
            token.type = Tokens.MENTION;
          } else
          if ((charType === Tokens.LATIN) && 
              (token.length == 1) && 
              ((s[token.st] == "'") || (s[token.st] == '’'))) {
            append = true;
            token.type = Tokens.WORD;
            token.subType = Tokens.LATIN;
          } else
          if ((token.length == 1) && (s[token.st] == '-')) { // -цать (?), 3-й
            append = true;

            if ((last > 0) && (ts[last - 1].type === Tokens.NUMBER)) {
              token = ts[last - 1];
              token.length += ts[last].length;

              ts.length -= 1;
            }

            token.type = Tokens.WORD;
            token.subType = charType;
          }
        } else
        if (charType === Tokens.DIGIT) {
          if (token.type === Tokens.WORD) {
            append = true;
            token.subType = Tokens.MIXED;
          } else
          if (token.type === Tokens.NUMBER) {
            append = true;
          } else
          if ((token.length == 1) &&
              ((s[token.st] == '+') || (s[token.st] == '-'))) {
            append = true;

            if ((last > 0) && (ts[last - 1].type === Tokens.NUMBER)) {
              token = ts[last - 1];
              token.length += ts[last].length;
              token.subType = Tokens.RANGE;

              ts.length -= 1;
            }

            token.type = Tokens.NUMBER;
          } else
          if ((token.length == 1) &&
              ((s[token.st] == ',') || (s[token.st] == '.')) && 
              (ts.length > 1) && 
              (ts[last - 1].type === Tokens.NUMBER)) {
            append = true;

            token = ts[last - 1];
            token.length += ts[last].length;

            ts.length -= 1;
          }
        } else
        if (charType === Tokens.SPACE) {
          if (token.type === Tokens.SPACE) {
            append = true;
          }
        } else
        if ((token.type === Tokens.MARKUP) && 
            (s[token.st] == ch) &&
            ('=-~:*#`\'>_'.indexOf(ch) > -1)) {
          append = true;
        } else
        if (ch == '.') {
          if (config.links && 
              config.links.www && 
              (token.length == 3) &&
              (token.toLowerCase() == 'www')) { // Links without protocol but with www
            append = true;
            token.type = Tokens.LINK;
          }
        } else
        if (config.wiki && (ch == "'") && (s[token.en()] == "'")) {
          if (token.length > 1) {
            token.length--;
            st--;
            tokenType = Tokens.MARKUP;
          } else {
            append = true;
            token.type = Tokens.MARKUP;
          }
        } else
        if ((ch == '-') || 
            ((token.subType == Tokens.LATIN) && 
             ((ch == '’') || (ch == "'")))) {
          if (token.type === Tokens.WORD) {
            append = true;
          }
        } else
        if (ch == '/') {
          if (config.links && 
              config.links.protocols &&
              (ts.length > 2) &&
              (ts[last - 2].type === Tokens.WORD) &&
              (ts[last - 2].subType == Tokens.LATIN) &&
              (ts[last - 1].length == 1) &&
              (s[ts[last - 1].st] == ':') &&
              (ts[last].length == 1) &&
              (s[ts[last].st] == '/')) { // Links (with protocols)
            append = true;

            token = ts[last - 2];
            token.length += ts[last - 1].length + ts[last].length;
            token.allUpper = token.allUpper && ts[last - 1].allUpper && ts[last].allUpper;
            token.type = Tokens.LINK;

            ts.length -= 2;
          }
        } else
        if (config.html && ch == ';') {
          if ((last > 0) && 
              (token.type === Tokens.WORD) && 
              (ts[last - 1].length == 1) &&
              (s[ts[last - 1].st] == '&')) {
            append = true;

            token = ts[last - 1];
            token.length += ts[last].length;
            token.allUpper = token.allUpper && ts[last - 1].allUpper;
            token.type = Tokens.ENTITY;

            ts.length -= 1;
          } else
          if ((last > 1) && 
              ((token.type === Tokens.WORD) || 
               (token.type === Tokens.NUMBER)) && 
              (ts[last - 1].length == 1) &&
              (s[ts[last - 1].st] == '#') && 
              (ts[last - 2].length == 1) &&
              (s[ts[last - 2].st] == '&')) {
            append = true;

            token = ts[last - 2];
            token.length += ts[last - 1].length + ts[last].length;
            token.allUpper = token.allUpper && ts[last - 1].allUpper && ts[last].allUpper;
            token.type = Tokens.ENTITY;

            ts.length -= 2;
          }
        } else
        if (config.markdown && 
            (ch == '[') && 
            (token.length == 1) &&
            (s[token.st] == '!')) {
          append = true;
          token.type = Tokens.MARKUP;
        } else
        if (config.markdown && 
            (ch == '(') &&
            (token.length == 1) &&
            (s[token.st] == ']')) {
          tokenType = Tokens.MARKUP;
          tokenSubType = Tokens.LINK;
        } else
        if (config.wiki && 
            (ch == '{') &&
            (token.length == 1) &&
            (s[token.st] == '{')) {
          append = true;
          token.type = Tokens.MARKUP;
          token.subType = Tokens.TEMPLATE;
        } else
        if (config.wiki && 
            (ch == '[') && 
            (token.length == 1) &&
            (s[token.st] == '[')) {
          append = true;
        } else
        if (config.wiki && 
            (ch == ']') && 
            (token.length == 1) &&
            (s[token.st] == ']')) {
          append = true;
        } else
        if (config.wiki && (ch == '|') && !lineStart) {
          var found = -1;
          for (var j = last - 1; j >= 0; j--) {
            if ((ts[j].length == 2) && 
                (s[ts[j].st] == '[') && 
                (s[ts[j].st + 1] == '[')) {
              found = j;
              break;
            }
            if (((ts[j].length == 1) && 
                 (s[ts[j].st] == '|')) || 
                ts[j].indexOf('\n') > -1) {
              break;
            }
          }
          if (found > -1) {
            append = true;
            for (var j = last - 1; j >= found; j--) {
              token = ts[j];
              token.length += ts[j + 1].length;
              token.allUpper = token.allUpper && ts[j + 1].allUpper;
            }
            last = found;
            ts.length = last + 1;
            token.subType = Tokens.LINK;
          }
        }
      }

      if (append) {
        token.length++;
        token.allUpper = token.allUpper && charUpper;
      } else {
        token = new Token(s, st, i + 1 - st, ts.length, charUpper, charUpper, tokenType, tokenSubType);
        ts.push(token);
      }
    }
    return this;
  }

  function alwaysTrue() {
    return true;
  }

  function getMatcher(filter, exclude) {
    if (!filter) {
      return alwaysTrue();
    }
    if (typeof filter == 'function') {
      return filter;
    }
    var types = filter;
    var exclusive;
    if ('length' in filter) {
      exclusive = !exclude;
      types = {};
      for (var i = 0; i < filter.length; i++) {
        types[filter[i]] = true;
      }
    } else {
      exclusive = exclude;
      exclude = false;
    }
    return function(token, index, array) {
      if (token.subType) {
        var sub = token.type + '.' + token.subType;
        if (sub in types) {
          return types[sub] != exclude;
        }
      }
      if (token.type in types) {
        return types[token.type] != exclude;
      } else {
        return !exclusive;
      }
    }
  }

  /**
   * Завершает токенизацию, возвращая список токенов.
   *
   * Эта и другие функции принимают последними параметрами filter и флаг exclude. Они
   * служат для фильтрации токенов (потому что часто удобнее получать не все токены, а
   * только определенную часть из них).
   *
   * Если в filter передана функция, то параметр exclude игнорируется, а filter вызывается
   * аналогично коллбэку в методе Array.prototype.filter: ей передаются параметры
   * token, index, array (текущий токен, его индекс и общий список токенов). Будут
   * возвращены только токены, для которых функция вернет истинное значение.
   *
   * Если в filter передан массив (или объект с полем length), то возвращаются токены, типы
   * которых либо входят в этот массив (exclude=false), либо не входят в него (exclude=true).
   * Вместо типов можно использовать строки вида 'WORD.LATIN' (тип, символ «точка» и подтип).
   *
   * Если в filter передать объект, то ключами в нём должны быть типы токенов, а значениями -
   * true или false в зависимости от того, включать такие токены в ответ или нет. Как и в случае случае
   * с массивом, в качестве ключей можно использовать строки вида 'WORD.LATIN'.
   * Здесь параметр exclude означает, следует ли ограничить выдачу только теми типами, которые
   * перечислены в filter.
   * Значения с указанием подтипа имеют больший приоритет, чем просто типы. Благодаря этому можно
   * делать такие странные вещи:
   *
   * ```
   * t.done({ 'WORD': false, 'WORD.LATIN': true }, false);
   * ```
   * (то есть вернуть все теги, кроме тегов с типом WORD, но включить теги с подтипом LATIN)
   *
   * @param {Function|String[]|Object} [filter] Типы токенов, по которым нужно
   *  отфильтровать результат (или функция для фильтрации).
   * @param {boolean} [exclude=False] Инвертирует фильтр, т.е. возвращаются
   *  токены со всеми типами, за исключением перечисленных в filter.
   * @returns {Token[]} Список токенов после фильтрации.
   */
  Tokens.prototype.done = function(filter, exclude) {
    // Finalize tokenizing, return list of tokens
    // For now it just returns tokens, in the future there could be some additional work
    if (!filter) {
      return this.tokens;
    }
    var matcher = getMatcher(filter, exclude);
    var list = [];
    for (var i = 0; i < this.tokens.length; i++) {
      if (matcher(this.tokens[i], i, this.tokens)) {
        list.push(this.tokens[i]);
      }
    }
    return list;
  }

  /**
   * Подсчитывает текущее количество токенов.
   *
   * @param {Function|String[]|Object} [filter] См. описание метода done.
   * @param {boolean} [exclude=False] См. описание метода done.
   * @returns {Number} Число токенов после фильтрации.
   */
  Tokens.prototype.count = function(filter, exclude) {
    if (!filter) {
      return this.tokens.length;
    }
    var matcher = getMatcher(filter, exclude);
    var count = 0;
    for (var i = 0; i < this.tokens.length; i++) {
      if (matcher(this.tokens[i], i, this.tokens)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Получает следующий токен относительно текущей позиции.
   *
   * @param {boolean} moveIndex Следует ли переместить указатель к
   *  следующему токену (в противном случае следующий вызов nextToken вернет
   *  тот же результат)
   * @param {Function|String[]|Object} [filter] См. описание метода done.
   * @param {boolean} [exclude=False] См. описание метода done.
   * @returns {Token|null} Следующий токен или null, если подходящих токенов
   *  впереди нет.
   */
  Tokens.prototype.nextToken = function(moveIndex, filter, exclude) {
    var matcher = getMatcher(filter, exclude);
    var index = this.index;
    index++;
    while (index < this.tokens.length && matcher(this.tokens[index], index, this.tokens)) {
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

  /**
   * Проверяет, является ли следующий (за исключением пробелов) токен знаком
   * препинания или нет.
   *
   * @returns {Token|False} False, если следующий токен не является знаком
   *  препинания, либо сам токен в противном случае.
   */
  Tokens.prototype.punctAhead = function() {
    var token = this.nextToken(false, ['SPACE'], true);
    return token && token.type == 'PUNCT' && token;
  }

  /**
   * Получает предыдущий токен относительно текущей позиции.
   *
   * @param {boolean} moveIndex Следует ли переместить указатель к
   *  предыдущему токену (в противном случае следующий вызов prevToken вернет
   *  тот же результат)
   * @param {Function|String[]|Object} [filter] См. описание метода done.
   * @param {boolean} [exclude=False] См. описание метода done.
   * @returns {Token|null} Предыдущий токен или null, если подходящих токенов
   *  позади нет.
   */
  Tokens.prototype.prevToken = function(moveIndex, filter, exclude) {
    var matcher = getMatcher(filter, exclude);
    var index = this.index;
    index--;
    while (index >= 0 && matcher(this.tokens[index], index, this.tokens)) {
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

  /**
   * Проверяет, является ли предыдущий (за исключением пробелов) токен знаком
   * препинания или нет.
   *
   * @returns {Token|False} False, если предыдущий токен не является знаком
   *  препинания, либо сам токен в противном случае.
   */
  Tokens.prototype.punctBehind = function() {
    var token = this.prevToken(false, ['SPACE'], true);
    return token && token.type == 'PUNCT' && token;
  }

  /**
   * Проверяет, есть ли впереди текущей позиции токены, удовлетворяющие фильтру.
   *
   * @param {Function|String[]|Object} [filter] См. описание метода done.
   * @param {boolean} [exclude=False] См. описание метода done.
   * @returns {boolean} True если впереди есть хотя бы один подходящий токен,
   *  и False в противном случае.
   */
  Tokens.prototype.hasTokensAhead = function(filter, exclude) {
    return this.nextToken(false, filter, exclude) != null;
  }

  /**
   * Проверяет, есть ли позади текущей позиции токены, удовлетворяющие фильтру.
   *
   * @param {Function|String[]|Object} [filter] См. описание метода done.
   * @param {boolean} [exclude=False] См. описание метода done.
   * @returns {boolean} True если позади есть хотя бы один подходящий токен,
   *  и False в противном случае.
   */
  Tokens.prototype.hasTokensBehind = function(filter, exclude) {
    return this.prevToken(false, filter, exclude) != null;
  }

  return Tokens;
}));
