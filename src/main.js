import { EventBus } from './systems/events/event_bus.js';
import { computeVelocity, moveAndSlide } from './systems/player/movement.js';
import { generateIsland, isWater, Tile } from './systems/world/island_generator.js';
import { createDebugMenu } from './systems/debug/debug_menu.js';

const BASE_W = 640, BASE_H = 360, TILE = 16, PLAYER_SIZE = 12;
const SAND = 0xe8d48b, WATER = 0x2a6f97, PLAYER = 0xd93333;

const [stats, config] = await Promise.all([
  fetch('data/player_stats.json').then((r) => r.json()),
  fetch('data/game_config.json').then((r) => r.json()),
]);

class IslandScene extends Phaser.Scene {
  create() {
    this.grid = generateIsland(config.island);
    const g = this.add.graphics();
    this.grid.forEach((row, y) => row.forEach((t, x) => {
      g.fillStyle(t === Tile.SAND ? SAND : WATER).fillRect(x * TILE, y * TILE, TILE, TILE);
    }));
    const c = this.islandCenter();
    this.pos = { ...c };
    this.vel = { x: 0, y: 0 };
    this.player = this.add.rectangle(c.x, c.y, PLAYER_SIZE, PLAYER_SIZE, PLAYER);
    this.cameras.main.setBounds(0, 0, config.island.width_tiles * TILE, config.island.height_tiles * TILE);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setRoundPixels(true);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.unsub = EventBus.on('player_teleported', (p) => { this.pos = { ...p }; this.vel = { x: 0, y: 0 }; });
    this.events.once('shutdown', () => this.unsub());
    if (config.debug) createDebugMenu(document.getElementById('debug'), { islandCenter: () => this.islandCenter() });
  }

  islandCenter() {
    return { x: (config.island.width_tiles * TILE) / 2, y: (config.island.height_tiles * TILE) / 2 };
  }

  update(_t, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const k = this.keys;
    const dir = {
      x: (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
      y: (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
    };
    this.vel = computeVelocity(this.vel, dir, stats, dt);
    const r = moveAndSlide(this.pos, this.vel, PLAYER_SIZE / 2, dt, TILE, (tx, ty) => isWater(this.grid, tx, ty));
    this.pos = r.pos; this.vel = r.vel;
    this.player.setPosition(Math.round(this.pos.x), Math.round(this.pos.y));
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: BASE_W,
  height: BASE_H,
  pixelArt: true,
  backgroundColor: '#0b1d2a',
  scale: { mode: Phaser.Scale.NONE },
  scene: IslandScene,
});

// Integer scaling: the biggest whole-number zoom that fits the window.
function fitZoom() {
  game.scale.setZoom(Math.max(1, Math.floor(Math.min(innerWidth / BASE_W, innerHeight / BASE_H))));
}
addEventListener('resize', fitZoom);
fitZoom();
