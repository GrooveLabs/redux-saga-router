'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = buildRouteMatcher;

var _ruta = require('ruta3');

var _ruta2 = _interopRequireDefault(_ruta);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function normalizeRoutes(routes) {
  if (Array.isArray(routes)) {
    return routes;
  } else if (routes !== null && (typeof routes === 'undefined' ? 'undefined' : _typeof(routes)) === 'object') {
    return Object.keys(routes).map(function (pattern) {
      return { pattern: pattern, handler: routes[pattern] };
    });
  }

  throw new Error('Provided routes must either be an object in the form ' + '{ [pattern]: handler }, or an array whose elements are objects in the ' + 'form { pattern: string, handler: function }.');
}

function buildRouteMatcher(routes) {
  var routeMatcher = (0, _ruta2.default)();

  normalizeRoutes(routes).forEach(function (_ref) {
    var pattern = _ref.pattern,
        handler = _ref.handler;

    routeMatcher.addRoute(pattern, handler);
  });

  return routeMatcher;
}