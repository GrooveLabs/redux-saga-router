'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint no-console: ["error", { allow: ["error"] }] */


exports.default = router;

var _effects = require('redux-saga/effects');

var _fsmIterator2 = require('fsm-iterator');

var _fsmIterator3 = _interopRequireDefault(_fsmIterator2);

var _buildRouteMatcher = require('./buildRouteMatcher');

var _buildRouteMatcher2 = _interopRequireDefault(_buildRouteMatcher);

var _createHistoryChannel = require('./createHistoryChannel');

var _createHistoryChannel2 = _interopRequireDefault(_createHistoryChannel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var INIT = 'INIT';
var LISTEN = 'LISTEN';
var BEFORE_HANDLE_LOCATION = 'BEFORE_HANDLE_LOCATION';
var AWAIT_BEFORE_ALL = 'AWAIT_BEFORE_HANDLE_LOCATION';
var HANDLE_LOCATION = 'HANDLE_LOCATION';

function router(history, routes) {
  var _fsmIterator;

  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var routeMatcher = (0, _buildRouteMatcher2.default)(routes);
  var historyChannel = null;
  var lastMatch = null;
  var lastSaga = null;
  var pendingBeforeRouteChange = null;
  var currentLocation = null;

  function errorMessageValue(error, message) {
    var finalMessage = 'Redux Saga Router: ' + message + ':\n' + error.message;

    if ('stack' in error) {
      finalMessage += '\n' + error.stack;
    }

    return {
      value: (0, _effects.call)([console, console.error], finalMessage),
      next: LISTEN
    };
  }

  function deepEqual(x, y) {
    var ok = Object.keys,
        tx = typeof x === 'undefined' ? 'undefined' : _typeof(x),
        ty = typeof y === 'undefined' ? 'undefined' : _typeof(y);
    return x && y && tx === 'object' && tx === ty ? ok(x).length === ok(y).length && ok(x).every(function (key) {
      return deepEqual(x[key], y[key]);
    }) : x === y;
  }

  return (0, _fsmIterator3.default)(INIT, (_fsmIterator = {}, _fsmIterator[INIT] = function () {
    return {
      value: (0, _effects.call)(_createHistoryChannel2.default, history),
      next: LISTEN
    };
  }, _fsmIterator[LISTEN] = function (effects) {
    if (effects && !historyChannel) {
      historyChannel = effects;
    }

    if (effects instanceof Array) {
      lastSaga = effects[0];
    }

    if ('beforeRouteChange' in options) {
      return {
        value: (0, _effects.take)(historyChannel),
        next: BEFORE_HANDLE_LOCATION
      };
    }

    return {
      value: (0, _effects.take)(historyChannel),
      next: HANDLE_LOCATION
    };
  }, _fsmIterator[BEFORE_HANDLE_LOCATION] = function (location, fsm) {
    var path = location.pathname;
    var match = routeMatcher.match(path);
    currentLocation = location;

    if (!match) {
      return fsm[LISTEN]();
    }

    pendingBeforeRouteChange = (0, _effects.spawn)(options.beforeRouteChange, match.params);

    return {
      value: pendingBeforeRouteChange,
      next: AWAIT_BEFORE_ALL
    };
  }, _fsmIterator[AWAIT_BEFORE_ALL] = function (task) {
    if (task) {
      return { value: (0, _effects.join)(task), next: HANDLE_LOCATION };
    }
    return {
      value: (0, _effects.join)(pendingBeforeRouteChange),
      next: HANDLE_LOCATION
    };
  }, _fsmIterator[HANDLE_LOCATION] = function (location, fsm) {
    var path = location ? location.pathname : currentLocation.pathname;
    var match = routeMatcher.match(path);
    var effects = [];

    var onlyQueryParamChange = false;

    // Ensuring both match and lastMatch are not null before navigating keys in the 'else if'
    if (lastMatch === null || match === null) {
      onlyQueryParamChange = false;
    } else if (match.index === lastMatch.index && deepEqual(lastMatch.params, match.params)) {
      // If the indexs match, the root path has not changed
      // and if the url params are the same then those have not changed either.
      // The only other option that would trigger HANDLE_LOCATION
      // is if only the query params were changed.
      onlyQueryParamChange = true;
    }

    // This cancels any running sagas unless the only change in
    // the location is the query params.
    if (lastSaga && !onlyQueryParamChange) {
      console.log('======');
      console.log('=== lastSaga', lastSaga);
      console.log('=== lastSaga isCancelled() before the cancel', lastSaga.isCancelled());
      (0, _effects.cancel)(lastSaga);
      console.log('=== lastSaga isCancelled() after the cancel', lastSaga.isCancelled());
      console.log('=== effects', effects);
    }

    while (match !== null) {
      lastMatch = match;
      effects.push((0, _effects.spawn)(match.action, match.params));
      match = options.matchAll ? match.next() : null;
    }

    if (effects.length > 0) {
      return {
        value: (0, _effects.all)(effects),
        next: LISTEN
      };
    }

    return fsm[LISTEN]();
  }, _fsmIterator.throw = function _throw(e, fsm) {
    switch (fsm.previousState) {
      case HANDLE_LOCATION:
        return errorMessageValue(e, 'Unhandled ' + e.name + ' in route "' + lastMatch.route + '"');

      case LISTEN:
        return errorMessageValue(e, 'Unexpected ' + e.name + ' while listening for route');

      case BEFORE_HANDLE_LOCATION:
      case AWAIT_BEFORE_ALL:
        return errorMessageValue(e, 'Error ' + e.name + ' was uncaught within the before handle location hook.');

      default:
        return { done: true };
    }
  }, _fsmIterator));
}