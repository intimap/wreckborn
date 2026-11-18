import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickMeters, applyFood } from '../../../src/systems/survival/meters.js';
import { loadData, close } from '../../helpers.js';
const { survival: s } = loadData();
const full = { health: 100, hunger: 100, thirst: 100 };

test('thirst empties in about 1.5 days, hunger in about 3 (firm)', () => {
  const hThirst = 100 / s.thirst_per_hour, hHunger = 100 / s.hunger_per_hour;
  assert.ok(hThirst > 30 && hThirst < 42, `thirst ${hThirst}h`);
  assert.ok(hHunger > 64 && hHunger < 80, `hunger ${hHunger}h`);
});
test('one hour drains hunger and thirst', () => {
  const m = tickMeters(full, s, 60);
  close(m.hunger, 100 - s.hunger_per_hour);
  close(m.thirst, 100 - s.thirst_per_hour);
});
test('empty thirst drains health', () => {
  const m = tickMeters({ health: 50, hunger: 80, thirst: 0 }, s, 60);
  close(m.health, 50 - s.empty_health_per_hour);
});
test('health regenerates when well fed', () => {
  const m = tickMeters({ health: 50, hunger: 90, thirst: 90 }, s, 60);
  close(m.health, 50 + s.regen_health_per_hour);
});
test('sleep multiplier halves drain', () => {
  const m = tickMeters(full, s, 60, 0.5);
  close(m.thirst, 100 - s.thirst_per_hour / 2);
});
test('food is clamped to max', () => {
  const m = applyFood({ health: 95, hunger: 95, thirst: 10 }, s, { hunger: 20, thirst: 25, health: 10 });
  assert.deepEqual(m, { health: 100, hunger: 100, thirst: 35 });
});
