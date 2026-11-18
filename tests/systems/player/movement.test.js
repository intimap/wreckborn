import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeVelocity, moveAndSlide } from '../../../src/systems/player/movement.js';

const stats = JSON.parse(readFileSync(new URL('../../../data/player_stats.json', import.meta.url)));
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≈ ${b}`);

test('accelerates toward input', () => {
  close(computeVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, stats, 0.05).x, stats.acceleration * 0.05);
});
test('caps at move speed', () => {
  close(computeVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, stats, 10).x, stats.move_speed);
});
test('diagonal is not faster', () => {
  const v = computeVelocity({ x: 0, y: 0 }, { x: 1, y: 1 }, stats, 10);
  close(Math.hypot(v.x, v.y), stats.move_speed);
});
test('stops without input', () => {
  assert.deepEqual(computeVelocity({ x: 80, y: 0 }, { x: 0, y: 0 }, stats, 1), { x: 0, y: 0 });
});
test('walls block movement but allow sliding along them', () => {
  const blocked = (tx) => tx >= 2; // wall from x=32 onward
  const r = moveAndSlide({ x: 24, y: 24 }, { x: 100, y: 50 }, 6, 0.1, 16, blocked);
  assert.equal(r.pos.x, 24);
  assert.equal(r.vel.x, 0);
  close(r.pos.y, 29);
});
test('player stats data is valid', () => {
  for (const k of ['move_speed', 'acceleration', 'friction']) assert.ok(stats[k] > 0, k);
});
