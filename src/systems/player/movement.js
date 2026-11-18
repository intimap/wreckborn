// Free 8-direction movement with smooth start/stop. Pure functions: no Phaser, so they are unit-testable.

function moveToward(from, to, maxStep) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= maxStep || dist === 0) return { x: to.x, y: to.y };
  return { x: from.x + (dx / dist) * maxStep, y: from.y + (dy / dist) * maxStep };
}

// dir: input direction (each axis -1..1). stats: data/player_stats.json. dt: seconds.
export function computeVelocity(current, dir, stats, dt) {
  let { x, y } = dir;
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  if (x === 0 && y === 0) return moveToward(current, { x: 0, y: 0 }, stats.friction * dt);
  return moveToward(current, { x: x * stats.move_speed, y: y * stats.move_speed }, stats.acceleration * dt);
}

// Moves a square body (centre pos, half-size) by vel*dt, sliding along walls.
// isBlocked(tx, ty) says whether a tile is solid.
export function moveAndSlide(pos, vel, half, dt, tileSize, isBlocked) {
  const hits = (px, py) => {
    const x0 = Math.floor((px - half) / tileSize), x1 = Math.floor((px + half - 0.001) / tileSize);
    const y0 = Math.floor((py - half) / tileSize), y1 = Math.floor((py + half - 0.001) / tileSize);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isBlocked(tx, ty)) return true;
    return false;
  };
  let { x, y } = pos;
  const v = { ...vel };
  const nx = x + vel.x * dt;
  if (!hits(nx, y)) x = nx; else v.x = 0;
  const ny = y + vel.y * dt;
  if (!hits(x, ny)) y = ny; else v.y = 0;
  return { pos: { x, y }, vel: v };
}
