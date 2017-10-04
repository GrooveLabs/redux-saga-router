/* eslint no-console: ["error", { allow: ["error"] }] */
import { call, all, take, spawn, cancel, join } from 'redux-saga/effects';
import fsmIterator from 'fsm-iterator';
import buildRouteMatcher from './buildRouteMatcher';
import createHistoryChannel from './createHistoryChannel';

const INIT = 'INIT';
const LISTEN = 'LISTEN';
const BEFORE_HANDLE_LOCATION = 'BEFORE_HANDLE_LOCATION';
const AWAIT_BEFORE_ALL = 'AWAIT_BEFORE_HANDLE_LOCATION';
const HANDLE_LOCATION = 'HANDLE_LOCATION';

export default function router(history, routes, options = {}) {
  const routeMatcher = buildRouteMatcher(routes);
  let historyChannel = null;
  let lastMatch = null;
  let lastSaga = null;
  let pendingBeforeRouteChange = null;
  let currentLocation = null;

  function errorMessageValue(error, message) {
    let finalMessage = `Redux Saga Router: ${message}:\n${error.message}`;

    if ('stack' in error) {
      finalMessage += `\n${error.stack}`;
    }

    return {
      value: call([console, console.error], finalMessage),
      next: LISTEN,
    };
  }

  function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
      ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
  }

  return fsmIterator(INIT, {
    [INIT]: () => ({
      value: call(createHistoryChannel, history),
      next: LISTEN,
    }),

    [LISTEN](effects) {
      if (effects && !historyChannel) {
        historyChannel = effects;
      }

      if (effects instanceof Array) {
        [lastSaga] = effects;
      }

      if ('beforeRouteChange' in options) {
        return {
          value: take(historyChannel),
          next: BEFORE_HANDLE_LOCATION,
        };
      }

      return {
        value: take(historyChannel),
        next: HANDLE_LOCATION,
      };
    },

    [BEFORE_HANDLE_LOCATION](location, fsm) {
      const path = location.pathname;
      const match = routeMatcher.match(path);
      currentLocation = location;

      if (!match) {
        return fsm[LISTEN]();
      }

      pendingBeforeRouteChange = spawn(options.beforeRouteChange, match.params);

      return {
        value: pendingBeforeRouteChange,
        next: AWAIT_BEFORE_ALL,
      };
    },

    [AWAIT_BEFORE_ALL](task) {
      if (task) {
        return { value: join(task), next: HANDLE_LOCATION };
      }
      return {
        value: join(pendingBeforeRouteChange),
        next: HANDLE_LOCATION,
      };
    },

    [HANDLE_LOCATION](location, fsm) {
      const path = location ? location.pathname : currentLocation.pathname;
      let match = routeMatcher.match(path);
      const effects = [];

      let onlyQueryParamChange = false;

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

      while (match !== null) {
        lastMatch = match;
        effects.push(spawn(match.action, match.params));
        match = options.matchAll ? match.next() : null;
      }

      // This cancels any running sagas unless the only change in
      // the location is the query params.
      if (lastSaga && !onlyQueryParamChange) {
        effects.push(cancel(lastSaga));
      }

      if (effects.length > 0) {
        return {
          value: all(effects),
          next: LISTEN,
        };
      }

      return fsm[LISTEN]();
    },

    throw(e, fsm) {
      switch (fsm.previousState) {
        case HANDLE_LOCATION:
          return errorMessageValue(e, `Unhandled ${e.name} in route "${lastMatch.route}"`);

        case LISTEN:
          return errorMessageValue(e, `Unexpected ${e.name} while listening for route`);

        case BEFORE_HANDLE_LOCATION:
        case AWAIT_BEFORE_ALL:
          return errorMessageValue(e, `Error ${e.name} was uncaught within the before handle location hook.`);

        default:
          return { done: true };
      }
    },
  });
}
