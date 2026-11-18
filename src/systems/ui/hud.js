// HTML overlay: meters, clock, hotbar, interaction hint, messages and the crafting panel.
import * as Clock from '../time/game_clock.js';
import { whyCannotCraft, craft } from '../crafting/crafting.js';

export function createHud(data) {
  const $ = (id) => document.getElementById(id);
  const meters = $('meters'), clock = $('clock'), hotbar = $('hotbar'), toast = $('toast'), hint = $('hint'), craftPanel = $('craft');
  let toastTimer = 0;

  for (let i = 0; i < data.config.inventory_slots; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    s.innerHTML = `<span class="key">${(i + 1) % 10}</span><span class="swatch"></span><span class="count"></span>`;
    hotbar.appendChild(s);
  }

  function bar(label, value, color) {
    return `<div class="meter"><span>${label}</span><div class="track"><div class="fill" style="width:${value}%;background:${color}"></div></div></div>`;
  }

  return {
    craftOpen: () => craftPanel.style.display === 'block',

    render(state) {
      const m = state.meters;
      meters.innerHTML = bar('Health', m.health, '#d94040') + bar('Hunger', m.hunger, '#e0913a') + bar('Thirst', m.thirst, '#3a9be0');
      const s = Clock.season(state.clock, data.time);
      clock.textContent = `Day ${Clock.day(state.clock)} · ${Clock.format(state.clock)} · ${s.name}, day ${s.dayOfSeason}`;
      [...hotbar.children].forEach((el, i) => {
        const slot = state.inventory[i];
        el.classList.toggle('selected', i === state.selected);
        el.querySelector('.swatch').style.background = slot ? data.items[slot.id].color : 'transparent';
        el.querySelector('.count').textContent = slot && slot.count > 1 ? slot.count : '';
        el.title = slot ? data.items[slot.id].name : '';
      });
      const sel = state.inventory[state.selected];
      $('selected-name').textContent = sel ? data.items[sel.id].name + (data.items[sel.id].food ? ' (Q to eat)' : data.items[sel.id].placeable ? ' (E to place)' : '') : '';
    },

    hint(text) { hint.textContent = text; hint.style.display = text ? 'block' : 'none'; },

    toast(text, dt = 0) {
      if (text) { toast.textContent = text; toast.style.opacity = 1; toastTimer = 2.5; return; }
      toastTimer -= dt;
      if (toastTimer <= 0) toast.style.opacity = 0;
    },

    toggleCraft(getState, getStations, onChange) {
      if (this.craftOpen()) { craftPanel.style.display = 'none'; return; }
      craftPanel.style.display = 'block';
      this.renderCraft(getState, getStations, onChange);
    },

    renderCraft(getState, getStations, onChange) {
      const state = getState(), stations = getStations();
      craftPanel.innerHTML = '<strong>CRAFTING (C to close)</strong>';
      for (const r of data.recipes) {
        const why = whyCannotCraft(r, state.inventory, data.items, stations);
        const parts = Object.entries(r.inputs).map(([id, n]) => `${n} ${data.items[id].name}`);
        for (const t of r.tools ?? []) parts.push(`tool: ${data.items[t].name}`);
        if (r.station) parts.push(`at ${r.station}`);
        const b = document.createElement('button');
        b.className = why ? 'disabled' : '';
        b.innerHTML = `<span class="swatch" style="background:${data.items[r.output].color}"></span><b>${data.items[r.output].name}</b><br><span class="sub">${parts.join(' · ')}${why ? ` — ${why}` : ''}</span>`;
        b.addEventListener('click', () => {
          const res = craft(r, state.inventory, data.items, stations);
          this.toast(res.ok ? `Crafted ${data.items[r.output].name}` : res.reason);
          onChange();
          this.renderCraft(getState, getStations, onChange);
        });
        craftPanel.appendChild(b);
      }
    },
  };
}
