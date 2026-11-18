import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as I from '../../../src/systems/inventory/inventory.js';
import { loadData } from '../../helpers.js';
const { items } = loadData();

test('stacks up to the item limit, then uses new slots', () => {
  const inv = I.newInventory(3);
  assert.equal(I.add(inv, 'stick', 25, items), 0);
  assert.deepEqual(inv[0], { id: 'stick', count: 20 });
  assert.deepEqual(inv[1], { id: 'stick', count: 5 });
});
test('reports leftovers when full', () => {
  const inv = I.newInventory(1);
  assert.equal(I.add(inv, 'stone', 30, items), 10);
  assert.ok(!I.canAdd(inv, 'stick', 1, items));
});
test('remove is all-or-nothing', () => {
  const inv = I.newInventory(3); I.add(inv, 'stone', 3, items);
  assert.equal(I.remove(inv, 'stone', 5), false);
  assert.equal(I.count(inv, 'stone'), 3);
  assert.equal(I.remove(inv, 'stone', 3), true);
  assert.equal(inv[0], null);
});
test('lose half of every stack', () => {
  const inv = I.newInventory(3); I.add(inv, 'stick', 7, items); I.add(inv, 'spear', 1, items);
  I.loseFraction(inv, 0.5);
  assert.equal(I.count(inv, 'stick'), 4);
  assert.equal(I.count(inv, 'spear'), 1);
});
