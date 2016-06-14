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