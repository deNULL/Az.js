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
