import { EventBus } from './systems/events/event_bus.js';
import { computeVelocity, moveAndSlide } from './systems/player/movement.js';
import { isWater, Tile } from './systems/world/island_generator.js';
import { nearest } from './systems/gathering/world_resources.js';
import * as Clock from './systems/time/game_clock.js';
import * as Save from './systems/save/save_manager.js';
import { add } from './systems/inventory/inventory.js';
import { createDebugMenu } from './systems/debug/debug_menu.js';
import { createHud } from './systems/ui/hud.js';
import * as Game from './game_state.js';

const BASE_W = 640, BASE_H = 360, TILE = Game.TILE, PLAYER_SIZE = 12;
const SAND = 0xe8d48b, WATER = 0x2a6f97, PLAYER = 0xd93333;

const names = ['player_stats', 'game_config', 'time', 'survival', 'items', 'recipes', 'resources'];
const loaded = await Promise.all(names.map((n) => fetch(`data/${n}.json`).then((r) => r.json())));
const data = Object.fromEntries(names.map((n, i) => [n, loaded[i]]));
data.config = data.game_config;
const stats = data.player_stats;
const ctx = Game.makeContext(data);

function storage() { try { return window.localStorage; } catch { return null; } }
function loadOrNew() {
  try { const s = storage() && Save.load(storage()); if (s) return { state: s, loaded: true }; }
  catch (e) { console.warn('Could not load save:', e.message); }
  return { state: Game.newGame(ctx), loaded: false };
}
function saveGame(state) { try { storage() && Save.save(storage(), state); } catch (e) { console.warn('Save failed:', e.message); } }

const hud = createHud(data);
const hexColor = (s) => parseInt(s.slice(1), 16);

class IslandScene extends Phaser.Scene {
  create() {
    const { state, loaded } = loadOrNew();
    this.state = state;
    this.vel = { x: 0, y: 0 };

    const g = this.add.graphics();
    ctx.grid.forEach((row, y) => row.forEach((t, x) => g.fillStyle(t === Tile.SAND ? SAND : WATER).fillRect(x * TILE, y * TILE, TILE, TILE)));
    this.objects = this.add.graphics();
    this.player = this.add.rectangle(state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, PLAYER);
    this.highlight = this.add.graphics();
    this.night = this.add.rectangle(0, 0, BASE_W, BASE_H, 0x0a1430, 1).setOrigin(0).setScrollFactor(0).setAlpha(0);

    const W = data.config.island.width_tiles * TILE, H = data.config.island.height_tiles * TILE;
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setRoundPixels(true);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,Q,C,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,ZERO');
    const slotKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'];
    slotKeys.forEach((k, i) => this.keys[k].on('down', () => { this.state.selected = i; }));
    this.input.on('wheel', (_p, _o, _dx, dy) => {
      const n = data.config.inventory_slots;
      this.state.selected = (this.state.selected + (dy > 0 ? 1 : -1) + n) % n;
    });
    this.keys.E.on('down', () => {
      if (hud.craftOpen()) return;
      const r = Game.interact(this.state, ctx);
      if (r.slept) saveGame(this.state);
      if (r.message) hud.toast(r.message);
    });
    this.keys.Q.on('down', () => { const r = Game.eatSelected(this.state, ctx); if (r.message) hud.toast(r.message); });
    this.keys.C.on('down', () => hud.toggleCraft(() => this.state, () => Game.nearbyStations(this.state, ctx), () => {}));

    EventBus.on('player_teleported', (p) => { this.state.player = { ...p }; this.vel = { x: 0, y: 0 }; });
    if (data.config.debug) createDebugMenu(document.getElementById('debug'), this.debugApi());
    hud.toast(loaded ? `Welcome back. Day ${Clock.day(state.clock)}.` : 'You wake on the beach, alone. Find food and water.');
  }

  debugApi() {
    return {
      skipHours: (h) => Game.skipHours(this.state, ctx, h),
      seasonHours: () => data.time.days_per_season * 24,
      getMeters: () => this.state.meters,
      setMeter: (k, v) => { this.state.meters[k] = v; },
      itemList: () => Object.entries(data.items).map(([id, d]) => [id, d.name]),
      spawnItem: (id, n) => { const left = add(this.state.inventory, id, n, data.items); hud.toast(left ? 'Inventory full' : `Spawned ${n} ${data.items[id].name}`); },
      teleportOffset: (dx, dy) => EventBus.emit('player_teleported', { x: ctx.spawn.x + dx, y: ctx.spawn.y + dy }),
      saveNow: () => { saveGame(this.state); hud.toast('Saved (debug)'); },
      deleteSave: () => { try { Save.clear(storage()); } catch {} location.reload(); },
    };
  }

  update(_t, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const s = this.state;
    const paused = hud.craftOpen();

    if (!paused) {
      for (const ev of Game.update(s, ctx, dt)) {
        if (ev === 'passed_out') { saveGame(s); hud.toast('You collapse from exhaustion and wake at dawn. Game saved.'); }
        if (ev === 'washed_ashore') { this.vel = { x: 0, y: 0 }; hud.toast('Everything goes dark… You wash ashore at dawn, missing some of your things.'); }
      }
      const k = this.keys;
      const dir = {
        x: (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
        y: (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
      };
      this.vel = computeVelocity(this.vel, dir, stats, dt);
      const r = moveAndSlide(s.player, this.vel, PLAYER_SIZE / 2, dt, TILE, (tx, ty) => isWater(ctx.grid, tx, ty));
      s.player = r.pos; this.vel = r.vel;
    }
    this.player.setPosition(Math.round(s.player.x), Math.round(s.player.y));
    this.drawObjects();
    this.night.setAlpha(Clock.darkness(s.clock, data.time));
    hud.render(s);
    hud.toast(null, dt);
  }

  drawObjects() {
    const g = this.objects, s = this.state;
    g.clear();
    for (const p of s.placed) {
      g.fillStyle(hexColor(data.items[p.type].color));
      if (data.items[p.type].placeable.sleep) g.fillRect(p.x - 6, p.y - 4, 12, 8);
      else { g.fillCircle(p.x, p.y, 5); g.fillStyle(0xffd27a).fillCircle(p.x, p.y - 1, 2); }
    }
    for (const n of s.nodes) {
      const def = data.resources[n.type];
      g.fillStyle(hexColor(def.color));
      if (n.type === 'palm') {
        g.fillStyle(0x7a5230).fillRect(n.x - 1, n.y - 2, 3, 8);
        g.fillStyle(hexColor(def.color)).fillCircle(n.x, n.y - 4, def.size / 2);
        for (let i = 0; i < n.amount; i++) g.fillStyle(0x4a2f15).fillCircle(n.x - 3 + i * 3, n.y - 2, 1.5);
      } else if (n.type === 'bush') {
        g.fillCircle(n.x, n.y, def.size / 2);
        for (let i = 0; i < n.amount; i++) g.fillStyle(hexColor(data.items.berries.color)).fillRect(n.x - 3 + (i % 2) * 4, n.y - 3 + Math.floor(i / 2) * 4, 2, 2);
      } else if (n.type === 'crab') {
        g.fillRect(n.x - 3, n.y - 2, 6, 4);
        g.fillRect(n.x - 5, n.y - 3, 2, 2).fillRect(n.x + 3, n.y - 3, 2, 2);
      } else {
        const sz = def.size;
        g.fillStyle(0x000000, 0.25).fillRect(n.x - sz / 2 + 1, n.y - sz / 2 + 1, sz, sz);
        g.fillStyle(hexColor(def.color)).fillRect(n.x - sz / 2, n.y - sz / 2, sz, sz);
      }
    }
    // Highlight what E would act on.
    const h = this.highlight; h.clear();
    const { x, y } = s.player, range = data.config.interact_range;
    const node = nearest(s.nodes, x, y, range);
    const bed = !node && nearest(s.placed.filter((p) => data.items[p.type].placeable.sleep), x, y, range);
    const target = node || bed;
    if (target) {
      h.lineStyle(1, 0xffffff, 0.9).strokeRect(target.x - 8, target.y - 8, 16, 16);
      hud.hint(node ? `E: gather ${data.resources[node.type].name.toLowerCase()}` : 'E: sleep until morning (saves)');
    } else hud.hint('');
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: BASE_W, height: BASE_H, pixelArt: true,
  backgroundColor: '#0b1d2a', scale: { mode: Phaser.Scale.NONE }, scene: IslandScene,
});
function fitZoom() { game.scale.setZoom(Math.max(1, Math.floor(Math.min(innerWidth / BASE_W, innerHeight / BASE_H)))); }
addEventListener('resize', fitZoom);
fitZoom();
