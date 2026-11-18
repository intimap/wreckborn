import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateNodes, harvest, newDay, rng } from '../../../src/systems/gathering/world_resources.js';
import { generateIsland } from '../../../src/systems/world/island_generator.js';
import { loadData } from '../../helpers.js';
const { resources, config } = loadData();
const grid = generateIsland(config.island);

test('spawns the configured count of each resource, one per tile', () => {
  const nodes = generateNodes(resources, grid, 16, 42, new Set());
  for (const [type, def] of Object.entries(resources)) assert.equal(nodes.filter((n) => n.type === type).length, def.count, type);
  const tiles = new Set(nodes.map((n) => `${n.x},${n.y}`));
  assert.equal(tiles.size, nodes.length);
});
test('same seed gives the same island', () => {
  assert.deepEqual(generateNodes(resources, grid, 16, 7, new Set()), generateNodes(resources, grid, 16, 7, new Set()));
});
test('palms give coconuts until bare, then regrow one per day', () => {
  const nodes = generateNodes({ palm: resources.palm }, grid, 16, 1, new Set());
  const palm = nodes[0];
  for (let i = 0; i < resources.palm.max_yield; i++) assert.equal(harvest(nodes, palm, resources.palm, true).item, 'coconut');
  assert.ok(harvest(nodes, palm, resources.palm, true).error);
  newDay(nodes, { palm: resources.palm }, grid, 16, rng(1), new Set());
  assert.equal(palm.amount, 1);
});
test('crabs need a spear and are removed when caught, then respawn next day', () => {
  const res = { crab: resources.crab };
  const nodes = generateNodes(res, grid, 16, 3, new Set());
  assert.ok(harvest(nodes, nodes[0], resources.crab, false).error);
  assert.ok(harvest(nodes, nodes[0], resources.crab, true).removed);
  assert.equal(nodes.length, resources.crab.count - 1);
  newDay(nodes, res, grid, 16, rng(9), new Set());
  assert.equal(nodes.length, resources.crab.count);
});
