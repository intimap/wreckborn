import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../../../src/systems/events/event_bus.js';

test('emits to listeners and unsubscribes', () => {
  let got = null;
  const off = EventBus.on('ping', (p) => { got = p; });
  EventBus.emit('ping', 5);
  assert.equal(got, 5);
  off();
  EventBus.emit('ping', 9);
  assert.equal(got, 5);
});
