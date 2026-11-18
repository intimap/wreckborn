// Resource nodes on the island: palms, bushes, crabs and ground pickups.
// A node is { id, type, x, y, amount, regrowTimer }. Positions are in pixels (tile centres).
import { Tile } from '../world/island_generator.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function waterWithin(grid, x, y, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (grid[y + dy]?.[x + dx] !== Tile.SAND) return true;
  return false;
}

export function candidateTiles(grid, placement) {
  const out = [];
  grid.forEach((row, y) => row.forEach((t, x) => {
    if (t !== Tile.SAND) return;
    if (placement === 'inland' && waterWithin(grid, x, y, 2)) return;
    if (placement === 'shore' && !waterWithin(grid, x, y, 1)) return;
    out.push({ x, y });
  }));
  return out;
}

// Places up to `n` new nodes of a type on free tiles. Mutates `nodes`.
export function spawn(nodes, type, def, n, grid, tile, random, blocked = new Set()) {
  const used = new Set([...blocked, ...nodes.map((o) => `${Math.floor(o.x / tile)},${Math.floor(o.y / tile)}`)]);
  const free = candidateTiles(grid, def.placement).filter((p) => !used.has(`${p.x},${p.y}`));
  let nextId = nodes.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  for (let i = 0; i < n && free.length; i++) {
    const p = free.splice(Math.floor(random() * free.length), 1)[0];
    nodes.push({ id: nextId++, type, x: p.x * tile + tile / 2, y: p.y * tile + tile / 2, amount: def.max_yield, regrowTimer: 0 });
  }
}

export function generateNodes(resources, grid, tile, seed, blocked) {
  const nodes = [], random = rng(seed);
  for (const [type, def] of Object.entries(resources)) spawn(nodes, type, def, def.count, grid, tile, random, blocked);
  return nodes;
}

// One gather action. Returns { item, removed } or { error }.
export function harvest(nodes, node, def, hasTool) {
  if (def.tool && !hasTool) return { error: `Need a ${def.tool} to catch this` };
  if (node.amount <= 0) return { error: `The ${def.name.toLowerCase()} is bare` };
  node.amount -= 1;
  let removed = false;
  if (def.depletes && node.amount <= 0) { nodes.splice(nodes.indexOf(node), 1); removed = true; }
  return { item: def.item, removed };
}

// Runs once per new day: regrow plants, respawn pickups and crabs back up to their counts.
export function newDay(nodes, resources, grid, tile, random, blocked) {
  for (const n of nodes) {
    const def = resources[n.type];
    if (def.depletes || n.amount >= def.max_yield) { n.regrowTimer = 0; continue; }
    n.regrowTimer += 1;
    if (n.regrowTimer >= def.regrow_every_days) { n.amount = Math.min(def.max_yield, n.amount + def.regrow_amount); n.regrowTimer = 0; }
  }
  for (const [type, def] of Object.entries(resources)) {
    if (!def.depletes) continue;
    const have = nodes.filter((n) => n.type === type).length;
    if (have < def.count) spawn(nodes, type, def, def.count - have, grid, tile, random, blocked);
  }
}

export function nearest(list, x, y, range) {
  let best = null, bd = range;
  for (const o of list) { const d = Math.hypot(o.x - x, o.y - y); if (d <= bd) { bd = d; best = o; } }
  return best;
}
