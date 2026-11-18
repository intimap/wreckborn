// F1 debug menu (an HTML overlay). Only active when data/game_config.json has "debug": true.
// Each new system adds its controls here through the `api` object.

function el(tag, attrs = {}, text) {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  if (text) e.textContent = text;
  return e;
}

export function createDebugMenu(root, api) {
  root.innerHTML = '';
  root.appendChild(el('strong', {}, 'DEBUG (F1)'));
  const section = (name) => root.appendChild(el('div', { className: 'section' }, name));
  const button = (label, fn, parent = root) => {
    const b = el('button', {}, label);
    b.addEventListener('click', () => { fn(); refresh(); });
    parent.appendChild(b);
    return b;
  };
  const row = () => root.appendChild(el('div', { className: 'row' }));

  section('Time');
  const t = row();
  button('+1h', () => api.skipHours(1), t);
  button('+6h', () => api.skipHours(6), t);
  button('+1 day', () => api.skipHours(24), t);
  button('+1 season', () => api.skipHours(api.seasonHours()), t);

  section('Survival meters');
  const sliders = {};
  for (const k of ['health', 'hunger', 'thirst']) {
    const r = row();
    r.appendChild(el('label', {}, k));
    const s = el('input', { type: 'range', min: 0, max: 100, step: 1 });
    s.addEventListener('input', () => api.setMeter(k, Number(s.value)));
    r.appendChild(s);
    sliders[k] = s;
  }

  section('Spawn item');
  const sr = row();
  const pick = el('select');
  for (const [id, name] of api.itemList()) pick.appendChild(el('option', { value: id }, name));
  sr.appendChild(pick);
  button('+1', () => api.spawnItem(pick.value, 1), sr);
  button('+10', () => api.spawnItem(pick.value, 10), sr);

  section('Teleport');
  const tp = row();
  button('Centre', () => api.teleportOffset(0, 0), tp);
  button('North', () => api.teleportOffset(0, -150), tp);
  button('East', () => api.teleportOffset(250, 0), tp);

  section('Save');
  const sv = row();
  button('Save now', () => api.saveNow(), sv);
  button('Delete save + restart', () => api.deleteSave(), sv);

  function refresh() {
    const m = api.getMeters();
    for (const k in sliders) sliders[k].value = Math.round(m[k]);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'F1') return;
    e.preventDefault();
    const open = root.style.display !== 'block';
    root.style.display = open ? 'block' : 'none';
    if (open) refresh();
  });
}
