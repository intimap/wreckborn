class_name Island
extends Node2D
## Draws the placeholder island and walls off the water so the player stays on land.

const TILE := 16
const SAND_COLOR := Color("e8d48b")
const WATER_COLOR := Color("2a6f97")

@export var width_tiles := 60
@export var height_tiles := 40
@export var radius_x := 22.0
@export var radius_y := 14.0

var grid: Array = []

func _ready() -> void:
	grid = IslandGenerator.generate(width_tiles, height_tiles, radius_x, radius_y)
	var walls := StaticBody2D.new()
	add_child(walls)
	for y in height_tiles:
		for x in width_tiles:
			if grid[y][x] == IslandGenerator.Tile.WATER:
				var shape := CollisionShape2D.new()
				var rect := RectangleShape2D.new()
				rect.size = Vector2(TILE, TILE)
				shape.shape = rect
				shape.position = Vector2(x, y) * TILE + Vector2(TILE, TILE) / 2
				walls.add_child(shape)
	queue_redraw()

func _draw() -> void:
	for y in grid.size():
		for x in grid[y].size():
			var c := SAND_COLOR if grid[y][x] == IslandGenerator.Tile.SAND else WATER_COLOR
			draw_rect(Rect2(Vector2(x, y) * TILE, Vector2(TILE, TILE)), c)

func center() -> Vector2:
	return Vector2(width_tiles, height_tiles) * TILE / 2
