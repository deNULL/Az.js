import*as fs from"fs";export let Az={load:function(e,n,r){fs.readFile(e,{encoding:"json"==n?"utf8":null},(function(e,f){if(e)r(e);else if("json"==n)r(null,JSON.parse(f));else if("arraybuffer"==n)if(f.buffer)r(null,f.buffer);else{let e=new ArrayBuffer(f.length),n=new Uint8Array(e);for(let e=0;e<f.length;++e)n[e]=f[e];r(null,e)}else r(new Error("Unknown responseType"))}))},extend:function(e,n){let r={};for(let e=0;e<arguments.length;e++)for(let n in arguments[e])r[n]=arguments[e][n];return r}};