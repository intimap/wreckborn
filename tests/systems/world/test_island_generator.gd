extends GutTest

func test_centre_is_sand_corners_are_water() -> void:
	var g := IslandGenerator.generate(60, 40, 22.0, 14.0)
	assert_eq(g.size(), 40)
	assert_eq(g[0].size(), 60)
	assert_eq(g[20][30], IslandGenerator.Tile.SAND)
	assert_eq(g[0][0], IslandGenerator.Tile.WATER)
	assert_eq(g[39][59], IslandGenerator.Tile.WATER)
