// Placeholder island layout: an oval of sand surrounded by water.
export const Tile = Object.freeze({ WATER: 0, SAND: 1 });

// Returns grid[y][x] of Tile values.
export function generateIsland({ width_tiles, height_tiles, radius_x, radius_y }) {
  const cx = (width_tiles - 1) / 2, cy = (height_tiles - 1) / 2;
  const grid = [];
  for (let y = 0; y < height_tiles; y++) {
    const row = [];
    for (let x = 0; x < width_tiles; x++) {
      const dx = (x - cx) / radius_x, dy = (y - cy) / radius_y;
      row.push(dx * dx + dy * dy <= 1 ? Tile.SAND : Tile.WATER);
    }
    grid.push(row);
  }
  return grid;
}

// Anything outside the map counts as water.
export function isWater(grid, tx, ty) {
  return grid[ty]?.[tx] !== Tile.SAND;
}
