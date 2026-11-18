import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../../src/systems/save/save_manager.js';

function memoryStorage() { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; }

test('save and load round-trip', () => {
  const st = memoryStorage();
  S.save(st, { a: 1, inv: [{ id: 'stick', count: 2 }, null] });
  assert.deepEqual(S.load(st), { a: 1, inv: [{ id: 'stick', count: 2 }, null] });
});
test('no save returns null; clear removes it', () => {
  const st = memoryStorage();
  assert.equal(S.load(st), null);
  S.save(st, {}); S.clear(st);
  assert.equal(S.load(st), null);
});
test('saves carry the version and reject newer versions', () => {
  assert.equal(JSON.parse(S.serialize({})).version, S.SAVE_VERSION);
  assert.throws(() => S.deserialize(JSON.stringify({ version: S.SAVE_VERSION + 1, state: {} })), /newer/);
});
