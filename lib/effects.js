'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.all = exports.join = exports.cancel = exports.spawn = exports.take = exports.call = undefined;

var _effects = require('redux-saga/effects');

var sagaEffects = _interopRequireWildcard(_effects);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var call = exports.call = sagaEffects.call;
var take = exports.take = sagaEffects.take;
var spawn = exports.spawn = sagaEffects.spawn;
var cancel = exports.cancel = sagaEffects.cancel;
var join = exports.join = sagaEffects.join;

// eslint-disable-next-line import/namespace
var all = exports.all = sagaEffects.all || function (effects) {
  return effects;
};