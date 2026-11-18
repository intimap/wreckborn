// Ties the systems together. No Phaser here, so the whole game loop can be tested.
import * as Clock from './systems/time/game_clock.js';
import { newMeters, tickMeters, applyFood, isDead } from './systems/survival/meters.js';
import * as Inv from './systems/inventory/inventory.js';
import { generateNodes, harvest, newDay, nearest, rng } from './systems/gathering/world_resources.js';
import { generateIsland } from './systems/world/island_generator.js';

export const TILE = 16;

// ctx holds things derived from data that are not saved: the data itself, the island grid, the spawn point.
export function makeContext(data) {
  const grid = generateIsland(data.config.island);
  const spawn = { x: (data.config.island.width_tiles * TILE) / 2, y: (data.config.island.height_tiles * TILE) / 2 };
  return { data, grid, spawn };
}

function blockedTiles(state, ctx) {
  const b = new Set(state.placed.map((p) => `${Math.floor(p.x / TILE)},${Math.floor(p.y / TILE)}`));
  const sx = Math.floor(ctx.spawn.x / TILE), sy = Math.floor(ctx.spawn.y / TILE);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 2; dx++) b.add(`${sx + dx},${sy + dy}`);
  return b;
}

export function newGame(ctx, seed = Math.floor(Math.random() * 1e9)) {
  const { data } = ctx;
  const off = data.config.start_bedroll_offset;
  const state = {
    seed,
    clock: Clock.newClock(data.time),
    meters: newMeters(data.survival),
    inventory: Inv.newInventory(data.config.inventory_slots),
    selected: 0,
    player: { ...ctx.spawn },
    placed: [{ id: 1, type: 'wreck_bedroll', x: ctx.spawn.x + off.x, y: ctx.spawn.y + off.y }],
    nodes: [],
  };
  state.lastDay = Clock.day(state.clock);
  state.nodes = generateNodes(data.resources, ctx.grid, TILE, seed, blockedTiles(state, ctx));
  return state;
}

function runNewDays(state, ctx) {
  while (state.lastDay < Clock.day(state.clock)) {
    newDay(state.nodes, ctx.data.resources, ctx.grid, TILE, rng(state.seed + state.lastDay), blockedTiles(state, ctx));
    state.lastDay += 1;
  }
}

// Advance time and meters. Returns a list of events for the UI: 'passed_out', 'washed_ashore'.
export function update(state, ctx, realSeconds) {
  const minutes = Clock.gameMinutesFor(realSeconds, ctx.data.time);
  state.clock.total += minutes;
  state.meters = tickMeters(state.meters, ctx.data.survival, minutes);
  runNewDays(state, ctx);
  const events = [];
  if (isDead(state.meters)) { washAshore(state, ctx); events.push('washed_ashore'); }
  else if (Clock.isPassOutTime(state.clock, ctx.data.time)) { sleep(state, ctx, true); events.push('passed_out'); }
  return events;
}

// Sleep (or pass out) until wake hour. Caller saves afterwards.
export function sleep(state, ctx, passedOut = false) {
  const { time, survival } = ctx.data;
  const minutes = Clock.minutesUntilHour(state.clock, time.wake_hour);
  state.clock.total += minutes;
  state.meters = tickMeters(state.meters, survival, minutes, survival.sleep_drain_multiplier);
  const bonus = passedOut ? -survival.pass_out_health_penalty : survival.sleep_health;
  state.meters.health = Math.max(1, Math.min(survival.max, state.meters.health + bonus));
  runNewDays(state, ctx);
}

export function washAshore(state, ctx) {
  const { time, survival } = ctx.data;
  state.clock.total += Clock.minutesUntilHour(state.clock, time.wake_hour);
  const v = survival.wash_ashore_meters;
  state.meters = { health: v, hunger: v, thirst: v };
  Inv.loseFraction(state.inventory, survival.wash_ashore_item_loss);
  state.player = { ...ctx.spawn };
  runNewDays(state, ctx);
}

// Debug: jump time forward without draining meters.
export function skipHours(state, ctx, hours) {
  state.clock.total += hours * 60;
  runNewDays(state, ctx);
}

export function nearbyStations(state, ctx) {
  const r = ctx.data.config.interact_range * 2;
  return state.placed
    .filter((p) => Math.hypot(p.x - state.player.x, p.y - state.player.y) <= r)
    .map((p) => ctx.data.items[p.type].placeable?.station)
    .filter(Boolean);
}

// The E key. Returns { message, slept? }.
export function interact(state, ctx) {
  const { items, resources, config } = ctx.data;
  const { x, y } = state.player;
  const node = nearest(state.nodes, x, y, config.interact_range);
  if (node) {
    const def = resources[node.type];
    if (!Inv.canAdd(state.inventory, def.item, 1, items)) return { message: 'Inventory full' };
    const r = harvest(state.nodes, node, def, def.tool ? Inv.count(state.inventory, def.tool) > 0 : true);
    if (r.error) return { message: r.error };
    Inv.add(state.inventory, r.item, 1, items);
    return { message: `+1 ${items[r.item].name}` };
  }
  const bed = nearest(state.placed.filter((p) => items[p.type].placeable?.sleep), x, y, config.interact_range);
  if (bed) { sleep(state, ctx); return { message: 'You sleep until morning. Game saved.', slept: true }; }
  const sel = state.inventory[state.selected];
  if (sel && items[sel.id].placeable) {
    const id = state.placed.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    state.placed.push({ id, type: sel.id, x: Math.round(x), y: Math.round(y) });
    Inv.removeFromSlot(state.inventory, state.selected);
    return { message: `Placed ${items[sel.id].name}` };
  }
  return { message: '' };
}

// The Q key: eat or drink the selected item.
export function eatSelected(state, ctx) {
  const { items, survival } = ctx.data;
  const sel = state.inventory[state.selected];
  if (!sel) return { message: '' };
  const food = items[sel.id].food;
  if (!food) return { message: `You can't eat ${items[sel.id].name.toLowerCase()}` };
  state.meters = applyFood(state.meters, survival, food);
  const name = items[sel.id].name;
  Inv.removeFromSlot(state.inventory, state.selected);
  return { message: `Ate ${name.toLowerCase()}` };
}
