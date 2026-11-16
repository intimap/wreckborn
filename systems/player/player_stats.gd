class_name PlayerStats
extends Resource
## Tunable player movement numbers. Edit data/player_stats.tres in the editor.

@export var move_speed: float = 80.0      ## pixels per second at full speed
@export var acceleration: float = 800.0   ## how quickly the player reaches full speed
@export var friction: float = 1000.0      ## how quickly the player stops
