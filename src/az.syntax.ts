import { define } from "../types";

;(function (global: any, factory: any) {
  typeof exports === 'object' && typeof module !== 'undefined' ? (module.exports = module.exports || {}) && (module.exports.Syntax = factory(module.exports)) :
  typeof define === 'function' && define.amd ? define('Az.Syntax', ['Az'], factory) :
  (global.Az = global.Az || {}) && (global.Az.Syntax = factory(global.Az))
}(this, function (Az: any) { 'use strict';
  // TBD: Syntax analyzer
  let Syntax = function() {

  }

  return Syntax;
}));