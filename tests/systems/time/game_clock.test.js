import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../../../src/systems/time/game_clock.js';
import { loadData, close } from '../../helpers.js';
const { time } = loadData();

test('starts on day 1 at the start hour', () => {
  const c = C.newClock(time);
  assert.equal(C.day(c), 1);
  assert.equal(C.format(c), '06:00');
});
test('a full real day of seconds is one game day', () => {
  close(C.gameMinutesFor(time.real_seconds_per_day, time), 1440);
});
test('day rolls over at midnight', () => {
  const c = { total: 1439 }; assert.equal(C.day(c), 1);
  c.total = 1440; assert.equal(C.day(c), 2);
});
test('minutes until wake hour', () => {
  assert.equal(C.minutesUntilHour({ total: 22 * 60 }, 6), 8 * 60);
  assert.equal(C.minutesUntilHour({ total: 1440 + 3 * 60 }, 6), 3 * 60);
});
test('darkness: noon is light, midnight is dark, dusk is between', () => {
  assert.equal(C.darkness({ total: 12 * 60 }, time), 0);
  assert.equal(C.darkness({ total: 0 }, time), time.night_darkness);
  const d = C.darkness({ total: 19.5 * 60 }, time);
  assert.ok(d > 0 && d < time.night_darkness);
});
test('seasons advance after days_per_season', () => {
  assert.equal(C.season({ total: 0 }, time).name, time.seasons[0]);
  assert.equal(C.season({ total: time.days_per_season * 1440 }, time).name, time.seasons[1]);
});
test('pass-out window', () => {
  assert.ok(C.isPassOutTime({ total: 3 * 60 }, time));
  assert.ok(!C.isPassOutTime({ total: 23 * 60 }, time));
});
