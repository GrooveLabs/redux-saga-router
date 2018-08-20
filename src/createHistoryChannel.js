import { eventChannel, buffers } from 'redux-saga';

export default function createHistoryChannel(history) {
  function subscribe(emitter) {
    let initialLocation;

    if (typeof history.getCurrentLocation === 'function') {
      initialLocation = history.getCurrentLocation();
    } else {
      initialLocation = history.location;
    }

    if (initialLocation) {
      emitter(initialLocation);
    }

    return history.listen(location => {
      emitter(location);
    });
  }

  return eventChannel(subscribe, buffers.expanding);
}
