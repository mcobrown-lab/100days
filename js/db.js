// Local storage layer for the 100 Days app. All data stays on-device.
const DB = (() => {
  const STORAGE_KEY = 'hundredDaysData';

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function defaultData() {
    return {
      version: 1,
      startDate: todayISO(),
      weightUnit: 'kg',
      targets: { situps: 0, pushups: 0, plankSeconds: 0, kmRun: 0 },
      days: {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultData(), parsed);
    } catch (e) {
      console.error('Failed to load data, starting fresh', e);
      return defaultData();
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getDay(dateStr) {
    return state.days[dateStr] || { weight: null, meals: [], exercises: [] };
  }

  function ensureDay(dateStr) {
    if (!state.days[dateStr]) {
      state.days[dateStr] = { weight: null, meals: [], exercises: [] };
    }
    return state.days[dateStr];
  }

  function pruneIfEmpty(dateStr) {
    const d = state.days[dateStr];
    if (d && d.weight == null && d.meals.length === 0 && d.exercises.length === 0) {
      delete state.days[dateStr];
    }
  }

  function setWeight(dateStr, weight) {
    if (weight == null || weight === '') {
      if (state.days[dateStr]) {
        state.days[dateStr].weight = null;
        pruneIfEmpty(dateStr);
      }
    } else {
      ensureDay(dateStr).weight = Number(weight);
    }
    save();
  }

  function addMeal(dateStr, time, food) {
    const day = ensureDay(dateStr);
    const id = 'm' + Date.now() + Math.random().toString(36).slice(2, 7);
    day.meals.push({ id, time, food });
    day.meals.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    save();
    return id;
  }

  function removeMeal(dateStr, id) {
    const day = state.days[dateStr];
    if (!day) return;
    day.meals = day.meals.filter(m => m.id !== id);
    pruneIfEmpty(dateStr);
    save();
  }

  function addExercise(dateStr, type, amount, note) {
    const day = ensureDay(dateStr);
    const id = 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
    day.exercises.push({ id, type, amount: Number(amount), note: note || '' });
    save();
    return id;
  }

  function removeExercise(dateStr, id) {
    const day = state.days[dateStr];
    if (!day) return;
    day.exercises = day.exercises.filter(e => e.id !== id);
    pruneIfEmpty(dateStr);
    save();
  }

  function setStartDate(dateStr) {
    state.startDate = dateStr;
    save();
  }

  function setWeightUnit(unit) {
    state.weightUnit = unit;
    save();
  }

  function setTargets(targets) {
    state.targets = Object.assign({}, state.targets, targets);
    save();
  }

  function allDates() {
    return Object.keys(state.days).sort();
  }

  function raw() {
    return state;
  }

  return {
    todayISO, getDay, setWeight, addMeal, removeMeal, addExercise, removeExercise,
    setStartDate, setWeightUnit, setTargets, allDates, raw
  };
})();
