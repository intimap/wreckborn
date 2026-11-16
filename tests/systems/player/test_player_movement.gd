extends GutTest

var player: Player

func before_each() -> void:
	player = Player.new()
	player.stats = PlayerStats.new()
	add_child_autofree(player)

func test_accelerates_toward_input() -> void:
	var v := player.compute_velocity(Vector2.ZERO, Vector2.RIGHT, 0.05)
	assert_almost_eq(v.x, 40.0, 0.01)

func test_caps_at_move_speed() -> void:
	var v := player.compute_velocity(Vector2.ZERO, Vector2.RIGHT, 10.0)
	assert_almost_eq(v.x, player.stats.move_speed, 0.01)

func test_diagonal_not_faster() -> void:
	var v := player.compute_velocity(Vector2.ZERO, Vector2(1, 1), 10.0)
	assert_almost_eq(v.length(), player.stats.move_speed, 0.01)

func test_stops_without_input() -> void:
	var v := player.compute_velocity(Vector2(80, 0), Vector2.ZERO, 1.0)
	assert_eq(v, Vector2.ZERO)

func test_teleport_moves_player() -> void:
	EventBus.player_teleported.emit(Vector2(100, 50))
	assert_eq(player.global_position, Vector2(100, 50))
