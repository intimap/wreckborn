// Versioned save files. Saving only happens on sleep. Storage is passed in (localStorage in the game).
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'wreckborn.save';

// Add a function here for each future version bump: MIGRATIONS[1] turns a v1 save into v2, etc.
const MIGRATIONS = {};

export function serialize(state) {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), state });
}

export function deserialize(text) {
  let data = JSON.parse(text);
  if (typeof data.version !== 'number') throw new Error('Not a Wreckborn save');
  if (data.version > SAVE_VERSION) throw new Error(`Save is from a newer version (${data.version})`);
  while (data.version < SAVE_VERSION) {
    const step = MIGRATIONS[data.version];
    if (!step) throw new Error(`No migration from version ${data.version}`);
    data = step(data);
  }
  return data.state;
}

export function save(storage, state) { storage.setItem(SAVE_KEY, serialize(state)); }
export function load(storage) {
  const text = storage.getItem(SAVE_KEY);
  return text ? deserialize(text) : null;
}
export function clear(storage) { storage.removeItem(SAVE_KEY); }
