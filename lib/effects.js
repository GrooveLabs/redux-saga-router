'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.all = exports.join = exports.cancel = exports.spawn = exports.take = exports.call = undefined;

var _reduxSaga = require('redux-saga');

var call = exports.call = _reduxSaga.effects.call;
var take = exports.take = _reduxSaga.effects.take;
var spawn = exports.spawn = _reduxSaga.effects.spawn;
var cancel = exports.cancel = _reduxSaga.effects.cancel;
var join = exports.join = _reduxSaga.effects.join;

// eslint-disable-next-line import/namespace
var all = exports.all = _reduxSaga.effects.all || function (effects) {
  return effects;
};