extends Node2D

func _ready() -> void:
	$Player.global_position = $Island.center()
