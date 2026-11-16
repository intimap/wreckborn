class_name Player
extends CharacterBody2D
## Free 8-direction movement with smooth start/stop. Placeholder look: a coloured square.

@export var stats: PlayerStats = preload("res://data/player_stats.tres")

func _ready() -> void:
	EventBus.player_teleported.connect(func(p: Vector2) -> void: global_position = p; velocity = Vector2.ZERO)

func _physics_process(delta: float) -> void:
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	velocity = compute_velocity(velocity, dir, delta)
	move_and_slide()

## Pure function so it can be unit-tested without input.
func compute_velocity(current: Vector2, dir: Vector2, delta: float) -> Vector2:
	if dir.length() > 1.0:
		dir = dir.normalized()
	if dir == Vector2.ZERO:
		return current.move_toward(Vector2.ZERO, stats.friction * delta)
	return current.move_toward(dir * stats.move_speed, stats.acceleration * delta)
