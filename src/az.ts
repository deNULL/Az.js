/** @namespace Az **/
import * as fs from 'fs';

interface Az {
  load: (url: string, responseType: string, callback: (err: Error | null, data?: Buffer | ArrayBufferLike) => void) => void
  extend: (_1: any, _2: any) => any
}

export let Az : Az = {
  load: function(url: string, responseType: string | Buffer, callback: (err: Error | null, data?: Buffer | ArrayBufferLike) => void): void {
    fs.readFile(url, { encoding: responseType == 'json' ? 'utf8' : null }, function (err, data) {
      if (err) {
        callback(err);
        return;
      }

      if (responseType == 'json') {
        callback(null, JSON.parse(data as string));
      } else if (responseType == 'arraybuffer') {
        data = data as Buffer;

        if (data.buffer) {
          callback(null, data.buffer);
        } else {
          let ab = new ArrayBuffer(data.length);
          let view = new Uint8Array(ab);
          for (let i = 0; i < data.length; ++i) {
              view[i] = data[i] as number;
          }
          callback(null, ab);
        }
      } else {
        callback(new Error('Unknown responseType'));
      }
    });
    return;
  },
  extend: function(_1: any, _2: any): any {
    let result: any = {};
    for (let i = 0; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        result[key] = arguments[i][key];
      }
    }
    return result;
  }
};


