import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/game_state.js';
import * as C from '../src/systems/time/game_clock.js';
import { count, add } from '../src/systems/inventory/inventory.js';
import { loadData } from './helpers.js';
const data = loadData();
const ctx = G.makeContext(data);

test('new game: day 1, 06:00, bedroll placed, resources spawned', () => {
  const s = G.newGame(ctx, 1);
  assert.equal(C.format(s.clock), '06:00');
  assert.equal(s.placed[0].type, 'wreck_bedroll');
  assert.ok(s.nodes.length > 0);
});
test('gathering a node adds the item', () => {
  const s = G.newGame(ctx, 1);
  const palm = s.nodes.find((n) => n.type === 'palm');
  s.player = { x: palm.x, y: palm.y };
  assert.equal(G.interact(s, ctx).message, '+1 Coconut');
  assert.equal(count(s.inventory, 'coconut'), 1);
});
test('sleeping at the bedroll jumps to 06:00 next day and restores health', () => {
  const s = G.newGame(ctx, 1);
  s.clock.total = 22 * 60; s.meters.health = 50;
  s.player = { x: s.placed[0].x, y: s.placed[0].y };
  s.nodes = [];
  assert.ok(G.interact(s, ctx).slept);
  assert.equal(C.day(s.clock), 2);
  assert.equal(C.format(s.clock), '06:00');
  assert.ok(s.meters.health > 50);
});
test('staying up past 2am makes you pass out', () => {
  const s = G.newGame(ctx, 1);
  s.clock.total = 1440 + 2 * 60 - 0.5;
  assert.deepEqual(G.update(s, ctx, 1), ['passed_out']);
  assert.equal(C.format(s.clock), '06:00');
});
test('dying washes you ashore with half your items', () => {
  const s = G.newGame(ctx, 1);
  add(s.inventory, 'stick', 10, data.items);
  s.meters = { health: 0.001, hunger: 0, thirst: 0 };
  s.player = { x: 0, y: 0 };
  assert.deepEqual(G.update(s, ctx, 1), ['washed_ashore']);
  assert.equal(count(s.inventory, 'stick'), 5);
  assert.deepEqual(s.player, ctx.spawn);
  assert.equal(s.meters.health, data.survival.wash_ashore_meters);
});
test('eating food changes meters and uses the item', () => {
  const s = G.newGame(ctx, 1);
  add(s.inventory, 'opened_coconut', 1, data.items);
  s.meters.thirst = 10;
  G.eatSelected(s, ctx);
  assert.equal(s.meters.thirst, 35);
  assert.equal(count(s.inventory, 'opened_coconut'), 0);
});
test('placing a campfire makes it a nearby station', () => {
  const s = G.newGame(ctx, 1);
  s.nodes = []; s.player = { x: 100, y: 100 };
  add(s.inventory, 'campfire', 1, data.items);
  G.interact(s, ctx);
  assert.deepEqual(G.nearbyStations(s, ctx), ['campfire']);
});
test('the whole game state survives a save round-trip', async () => {
  const S = await import('../src/systems/save/save_manager.js');
  const s = G.newGame(ctx, 5);
  assert.deepEqual(S.deserialize(S.serialize(s)), s);
});
