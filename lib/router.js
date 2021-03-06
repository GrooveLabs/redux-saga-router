'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = router;

var _fsmIterator2 = require('fsm-iterator');

var _fsmIterator3 = _interopRequireDefault(_fsmIterator2);

var _buildRouteMatcher = require('./buildRouteMatcher');

var _buildRouteMatcher2 = _interopRequireDefault(_buildRouteMatcher);

var _createHistoryChannel = require('./createHistoryChannel');

var _createHistoryChannel2 = _interopRequireDefault(_createHistoryChannel);

var _effects = require('./effects');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint no-console: ["error", { allow: ["error"] }] */


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

  return (0, _fsmIterator3.default)(INIT, (_fsmIterator = {}, _defineProperty(_fsmIterator, INIT, function () {
    return {
      value: (0, _effects.call)(_createHistoryChannel2.default, history),
      next: LISTEN
    };
  }), _defineProperty(_fsmIterator, LISTEN, function (effects) {
    if (effects && !historyChannel) {
      historyChannel = effects;
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
  }), _defineProperty(_fsmIterator, BEFORE_HANDLE_LOCATION, function (location, fsm) {
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
  }), _defineProperty(_fsmIterator, AWAIT_BEFORE_ALL, function (task) {
    if (task) {
      return { value: (0, _effects.join)(task), next: HANDLE_LOCATION };
    }
    return {
      value: (0, _effects.join)(pendingBeforeRouteChange),
      next: HANDLE_LOCATION
    };
  }), _defineProperty(_fsmIterator, HANDLE_LOCATION, function (location, fsm) {
    var path = location ? location.pathname : currentLocation.pathname;
    var match = routeMatcher.match(path);
    var effects = [];

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
  }), _defineProperty(_fsmIterator, 'throw', function _throw(e, fsm) {
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
  }), _fsmIterator));
}