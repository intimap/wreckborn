import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateIsland, isWater, Tile } from '../../../src/systems/world/island_generator.js';

test('centre is sand, corners are water', () => {
  const g = generateIsland({ width_tiles: 60, height_tiles: 40, radius_x: 22, radius_y: 14 });
  assert.equal(g.length, 40);
  assert.equal(g[0].length, 60);
  assert.equal(g[20][30], Tile.SAND);
  assert.equal(g[0][0], Tile.WATER);
  assert.ok(isWater(g, -1, 5), 'outside the map counts as water');
});
