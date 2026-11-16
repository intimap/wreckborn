extends CanvasLayer
## F1 debug menu. Only exists in debug builds. Each new system adds its controls here.

var panel: PanelContainer

func _ready() -> void:
	if not OS.is_debug_build():
		queue_free()
		return
	layer = 100
	panel = PanelContainer.new()
	panel.position = Vector2(4, 4)
	panel.visible = false
	add_child(panel)
	var box := VBoxContainer.new()
	panel.add_child(box)
	var title := Label.new()
	title.text = "DEBUG (F1)"
	box.add_child(title)
	_add_button(box, "Teleport: island centre", func() -> void: _teleport_center())
	_add_button(box, "Teleport: north shore", func() -> void: _teleport_offset(Vector2(0, -150)))
	_add_button(box, "Teleport: east shore", func() -> void: _teleport_offset(Vector2(250, 0)))
	var todo := Label.new()
	todo.text = "Time / items / meters: coming in M1"
	todo.add_theme_font_size_override("font_size", 8)
	box.add_child(todo)

func _add_button(box: Node, text: String, cb: Callable) -> void:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.pressed.connect(cb)
	box.add_child(b)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_debug"):
		panel.visible = not panel.visible

func _teleport_center() -> void:
	var island := get_tree().get_first_node_in_group("island") as Island
	if island:
		EventBus.player_teleported.emit(island.center())

func _teleport_offset(offset: Vector2) -> void:
	var island := get_tree().get_first_node_in_group("island") as Island
	if island:
		EventBus.player_teleported.emit(island.center() + offset)
