extends GutTest

func test_player_stats_resource_loads() -> void:
	var s := load("res://data/player_stats.tres") as PlayerStats
	assert_not_null(s)
	assert_gt(s.move_speed, 0.0)
