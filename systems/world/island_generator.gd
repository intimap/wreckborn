class_name IslandGenerator
extends RefCounted
## Builds a placeholder island layout: an oval of sand surrounded by water.

enum Tile { WATER, SAND }

## Returns a 2D array [y][x] of Tile values.
static func generate(width: int, height: int, island_radius_x: float, island_radius_y: float) -> Array:
	var grid: Array = []
	var cx := (width - 1) / 2.0
	var cy := (height - 1) / 2.0
	for y in height:
		var row: Array = []
		for x in width:
			var dx := (x - cx) / island_radius_x
			var dy := (y - cy) / island_radius_y
			row.append(Tile.SAND if dx * dx + dy * dy <= 1.0 else Tile.WATER)
		grid.append(row)
	return grid
