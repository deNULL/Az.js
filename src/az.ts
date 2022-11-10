/** @namespace Az **/
let fs: any;
if (typeof require != 'undefined' && typeof exports === 'object' && typeof module !== 'undefined') {
  fs = require('fs');
}

export let Az = {
  load: function(url: string, responseType: string, callback: any) {
    if (fs) {
      fs.readFile(url, { encoding: responseType == 'json' ? 'utf8' : null }, function (err: any, data: any) {
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
            let ab = new ArrayBuffer(data.length);
            let view = new Uint8Array(ab);
            for (let i = 0; i < data.length; ++i) {
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

    let xhr: any = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = responseType;

    xhr.onload = function (e: any) {
      if (xhr.response) {
        callback && callback(null, xhr.response);
      }
    };

    xhr.send(null);
  },
  extend: function(_1: any, _2: any) {
    let result: any = {};
    for (let i = 0; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        result[key] = arguments[i][key];
      }
    }
    return result;
  }
};


