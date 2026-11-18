import { test } from 'node:test';
import assert from 'node:assert/strict';
import { craft, whyCannotCraft } from '../../../src/systems/crafting/crafting.js';
import * as I from '../../../src/systems/inventory/inventory.js';
import { loadData } from '../../helpers.js';
const { items, recipes } = loadData();
const R = Object.fromEntries(recipes.map((r) => [r.id, r]));

test('all recipes reference real items', () => {
  for (const r of recipes) {
    assert.ok(items[r.output], r.id);
    for (const id of [...Object.keys(r.inputs), ...(r.tools ?? [])]) assert.ok(items[id], `${r.id}: ${id}`);
  }
});
test('crafting consumes inputs and gives output', () => {
  const inv = I.newInventory(5); I.add(inv, 'stone', 3, items);
  assert.ok(craft(R.sharp_stone, inv, items, []).ok);
  assert.equal(I.count(inv, 'stone'), 1);
  assert.equal(I.count(inv, 'sharp_stone'), 1);
});
test('tools are required but not consumed', () => {
  const inv = I.newInventory(5); I.add(inv, 'coconut', 1, items);
  assert.match(whyCannotCraft(R.opened_coconut, inv, items, []), /Sharp stone/);
  I.add(inv, 'sharp_stone', 1, items);
  assert.ok(craft(R.opened_coconut, inv, items, []).ok);
  assert.equal(I.count(inv, 'sharp_stone'), 1);
});
test('station recipes need the station nearby', () => {
  const inv = I.newInventory(5); I.add(inv, 'raw_crab', 1, items);
  assert.equal(craft(R.cooked_crab, inv, items, []).ok, false);
  assert.ok(craft(R.cooked_crab, inv, items, ['campfire']).ok);
});
