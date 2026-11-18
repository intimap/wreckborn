// Global message hub. Systems talk through events instead of referencing each other.
const listeners = new Map();

export const EventBus = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name).delete(fn);
  },
  emit(name, payload) {
    for (const fn of listeners.get(name) ?? []) fn(payload);
  },
  clear() { listeners.clear(); },
};
