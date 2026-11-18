// Recipes: { id, output, count, inputs: {item: n}, tools?: [item], station?: string }.
import { count, remove, add, canAdd } from '../inventory/inventory.js';

// Returns null if craftable, otherwise a short reason.
export function whyCannotCraft(recipe, inv, items, nearbyStations) {
  for (const [id, n] of Object.entries(recipe.inputs)) if (count(inv, id) < n) return `Need ${n} ${items[id].name}`;
  for (const t of recipe.tools ?? []) if (count(inv, t) < 1) return `Need a ${items[t].name}`;
  if (recipe.station && !nearbyStations.includes(recipe.station)) return `Must be near a ${recipe.station}`;
  // Check output fits after inputs are removed.
  const copy = inv.map((s) => (s ? { ...s } : null));
  for (const [id, n] of Object.entries(recipe.inputs)) remove(copy, id, n);
  if (!canAdd(copy, recipe.output, recipe.count, items)) return 'Inventory full';
  return null;
}

export function craft(recipe, inv, items, nearbyStations) {
  const why = whyCannotCraft(recipe, inv, items, nearbyStations);
  if (why) return { ok: false, reason: why };
  for (const [id, n] of Object.entries(recipe.inputs)) remove(inv, id, n);
  add(inv, recipe.output, recipe.count, items);
  return { ok: true };
}
