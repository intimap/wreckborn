// The in-game clock. State is just { total } = minutes since the start of Day 1 at 00:00.
const DAY = 1440;

export function newClock(t) { return { total: t.start_hour * 60 }; }
export function day(c) { return Math.floor(c.total / DAY) + 1; }
export function minuteOfDay(c) { return ((c.total % DAY) + DAY) % DAY; }
export function hour(c) { return minuteOfDay(c) / 60; }

export function season(c, t) {
  const idx = Math.floor((day(c) - 1) / t.days_per_season);
  return { name: t.seasons[idx % t.seasons.length], dayOfSeason: ((day(c) - 1) % t.days_per_season) + 1 };
}

export function gameMinutesFor(realSeconds, t) { return (realSeconds * DAY) / t.real_seconds_per_day; }

// Minutes from now until the next time the clock reads `targetHour` (always > 0).
export function minutesUntilHour(c, targetHour) {
  const m = (targetHour * 60 - minuteOfDay(c) + DAY) % DAY;
  return m === 0 ? DAY : m;
}

export function format(c) {
  const m = Math.floor(minuteOfDay(c));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// 0 = full daylight, t.night_darkness = deepest night.
export function darkness(c, t) {
  const h = hour(c), max = t.night_darkness;
  if (h >= t.dusk_start_hour && h < t.dusk_end_hour) return max * (h - t.dusk_start_hour) / (t.dusk_end_hour - t.dusk_start_hour);
  if (h >= t.dawn_start_hour && h < t.dawn_end_hour) return max * (1 - (h - t.dawn_start_hour) / (t.dawn_end_hour - t.dawn_start_hour));
  if (h >= t.dusk_end_hour || h < t.dawn_start_hour) return max;
  return 0;
}

// True during the hours you're forced to be asleep (pass-out hour until wake hour).
export function isPassOutTime(c, t) {
  const h = hour(c);
  return h >= t.pass_out_hour && h < t.wake_hour;
}
