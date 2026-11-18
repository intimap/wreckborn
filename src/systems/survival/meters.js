// Health, hunger, thirst. All 0..max. Pure functions return new meter objects.
const clamp = (v, max) => Math.max(0, Math.min(max, v));

export function newMeters(s) { return { ...s.start }; }

// Advance meters by `minutes` of game time. drainMult scales hunger/thirst loss (e.g. 0.5 while asleep).
export function tickMeters(m, s, minutes, drainMult = 1) {
  const h = minutes / 60;
  const hunger = clamp(m.hunger - s.hunger_per_hour * h * drainMult, s.max);
  const thirst = clamp(m.thirst - s.thirst_per_hour * h * drainMult, s.max);
  let health = m.health;
  const empties = (hunger <= 0 ? 1 : 0) + (thirst <= 0 ? 1 : 0);
  if (empties) health -= s.empty_health_per_hour * empties * h;
  else if (hunger > s.regen_threshold && thirst > s.regen_threshold) health += s.regen_health_per_hour * h;
  return { health: clamp(health, s.max), hunger, thirst };
}

export function applyFood(m, s, food) {
  return {
    health: clamp(m.health + (food.health ?? 0), s.max),
    hunger: clamp(m.hunger + (food.hunger ?? 0), s.max),
    thirst: clamp(m.thirst + (food.thirst ?? 0), s.max),
  };
}

export function isDead(m) { return m.health <= 0; }
