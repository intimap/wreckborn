import { readFileSync } from 'node:fs';
const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url)));
export function loadData() {
  const d = Object.fromEntries(['player_stats', 'game_config', 'time', 'survival', 'items', 'recipes', 'resources'].map((n) => [n, load(n)]));
  d.config = d.game_config;
  return d;
}
export const close = (a, b, eps = 0.01) => { if (Math.abs(a - b) > eps) throw new Error(`${a} is not ≈ ${b}`); };
