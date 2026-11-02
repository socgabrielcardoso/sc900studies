// Validate untrusted browser storage and imported backup JSON before the UI reads it.
// Keep this module DOM-free so malformed state can be regression-tested in Node.
const dateValid = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const count = (value, max, fallback = 0) =>
  Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : fallback;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function normalizeProgress(raw, defaults, validIds, skinIds) {
  if (!record(raw) || raw.version !== 1) throw new TypeError('Unsupported progress format');
  const ids = new Set(validIds);
  const skins = new Set(skinIds);
  const state = { ...defaults };

  state.name = typeof raw.name === 'string' && raw.name.trim()
    ? raw.name.slice(0, 32) : defaults.name;
  state.startDate = dateValid(raw.startDate) ? raw.startDate : defaults.startDate;
  state.lastStudy = dateValid(raw.lastStudy) ? raw.lastStudy : '';
  state.heartsDay = dateValid(raw.heartsDay) ? raw.heartsDay : defaults.heartsDay;
  state.streak = count(raw.streak, 100000);
  state.coins = count(raw.coins, 100000);
  state.xp = count(raw.xp, 10000000);
  state.hearts = count(raw.hearts, 5, defaults.hearts);
  state.freezes = count(raw.freezes, 1000);
  state.lastBossScore = count(raw.lastBossScore, 100);
  for (const flag of ['quote', 'marathon', 'sound']) state[flag] = raw[flag] === true;

  state.completed = Array.isArray(raw.completed)
    ? [...new Set(raw.completed.filter(x => typeof x === 'string' &&
      /^(?:[1-9]|[12]\d|30)-[123]$/.test(x)))].slice(0, 90) : [];
  state.inventory = Array.isArray(raw.inventory)
    ? [...new Set(raw.inventory.filter(x => typeof x === 'string' && skins.has(x)))] : [];

  state.topics = {};
  if (record(raw.topics)) {
    for (const id of ids) {
      const topic = raw.topics[id];
      if (!record(topic)) continue;
      state.topics[id] = {
        right: count(topic.right, 100000),
        wrong: count(topic.wrong, 100000),
        box: count(topic.box, 4),
        due: dateValid(topic.due) ? topic.due : ''
      };
    }
  }

  state.notes = {};
  if (record(raw.notes)) {
    for (const id of ids) {
      if (typeof raw.notes[id] === 'string') state.notes[id] = raw.notes[id].slice(0, 2000);
    }
  }

  state.history = Array.isArray(raw.history) ? raw.history.slice(-3000)
    .filter(x => record(x) && ids.has(x.id) && typeof x.correct === 'boolean')
    .map(x => ({
      id: x.id, correct: x.correct,
      date: dateValid(x.date) ? x.date : defaults.startDate,
      at: count(x.at, Number.MAX_SAFE_INTEGER)
    })) : [];

  return state;
}
