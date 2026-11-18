// Slot inventory: an array of { id, count } or null. Functions mutate the array and report results.

export function newInventory(slots) { return Array(slots).fill(null); }

export function count(inv, id) { return inv.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0); }

// Adds as many as fit. Returns how many could NOT be added.
export function add(inv, id, n, items) {
  const max = items[id].stack;
  for (const s of inv) if (n > 0 && s?.id === id && s.count < max) { const k = Math.min(n, max - s.count); s.count += k; n -= k; }
  for (let i = 0; i < inv.length && n > 0; i++) if (!inv[i]) { const k = Math.min(n, max); inv[i] = { id, count: k }; n -= k; }
  return n;
}

export function canAdd(inv, id, n, items) {
  const copy = inv.map((s) => (s ? { ...s } : null));
  return add(copy, id, n, items) === 0;
}

// Removes n if available (all or nothing). Returns true on success.
export function remove(inv, id, n) {
  if (count(inv, id) < n) return false;
  for (let i = inv.length - 1; i >= 0 && n > 0; i--) {
    const s = inv[i];
    if (s?.id !== id) continue;
    const k = Math.min(n, s.count); s.count -= k; n -= k;
    if (s.count === 0) inv[i] = null;
  }
  return true;
}

export function removeFromSlot(inv, slot, n = 1) {
  const s = inv[slot];
  if (!s || s.count < n) return false;
  s.count -= n;
  if (s.count === 0) inv[slot] = null;
  return true;
}

// Lose a fraction of every stack (rounded down), e.g. when washing ashore.
export function loseFraction(inv, fraction) {
  for (let i = 0; i < inv.length; i++) {
    const s = inv[i];
    if (!s) continue;
    s.count -= Math.floor(s.count * fraction);
    if (s.count <= 0) inv[i] = null;
  }
}
