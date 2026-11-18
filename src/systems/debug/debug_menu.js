// F1 debug menu (an HTML overlay). Only active when data/game_config.json has "debug": true.
// Each new system adds its controls here.
import { EventBus } from '../events/event_bus.js';

export function createDebugMenu(el, { islandCenter }) {
  const buttons = [
    ['Teleport: island centre', () => EventBus.emit('player_teleported', islandCenter())],
    ['Teleport: north shore', () => { const c = islandCenter(); EventBus.emit('player_teleported', { x: c.x, y: c.y - 150 }); }],
    ['Teleport: east shore', () => { const c = islandCenter(); EventBus.emit('player_teleported', { x: c.x + 250, y: c.y }); }],
  ];
  el.innerHTML = '<strong>DEBUG (F1)</strong>';
  for (const [label, fn] of buttons) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', fn);
    el.appendChild(b);
  }
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = 'Time / items / meters: coming in M1';
  el.appendChild(note);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') { e.preventDefault(); el.style.display = el.style.display === 'block' ? 'none' : 'block'; }
  });
}
