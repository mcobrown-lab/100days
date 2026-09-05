(() => {
  const CHALLENGE_LENGTH = 100;
  const WEEK_LENGTH = 7;
  const TOTAL_WEEKS = Math.ceil(CHALLENGE_LENGTH / WEEK_LENGTH);

  const EXERCISE_META = {
    situps: { label: 'Sit-ups', unit: 'reps', icon: '🔥' },
    pushups: { label: 'Push-ups', unit: 'reps', icon: '💪' },
    plank: { label: 'Plank', unit: 'sec', icon: '🧘' },
    run: { label: 'Run', unit: 'km', icon: '🏃' },
    other: { label: 'Other', unit: 'min', icon: '⭐' }
  };

  let selectedDate = DB.todayISO();
  let currentMetric = 'situps';

  // ---------- date helpers ----------
  function parseISO(s) {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }
  function toISO(utcMs) {
    return new Date(utcMs).toISOString().slice(0, 10);
  }
  function addDays(dateStr, n) {
    return toISO(parseISO(dateStr) + n * 86400000);
  }
  function dayNumber(dateStr) {
    return Math.round((parseISO(dateStr) - parseISO(DB.raw().startDate)) / 86400000) + 1;
  }
  function weekNumber(dateStr) {
    return Math.ceil(dayNumber(dateStr) / WEEK_LENGTH);
  }
  function formatDateNice(dateStr) {
    const d = new Date(parseISO(dateStr));
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // ---------- tab switching ----------
  function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    if (name === 'progress') renderProgress();
    if (name === 'history') renderHistory();
    if (name === 'today') renderToday();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ---------- top bar ----------
  function renderTopBar() {
    const n = dayNumber(selectedDate);
    document.getElementById('dayBadge').textContent = `Day ${n} of ${CHALLENGE_LENGTH}`;
    const pct = Math.max(0, Math.min(100, (n / CHALLENGE_LENGTH) * 100));
    document.getElementById('overallProgress').style.width = pct + '%';
  }

  // ---------- Today view ----------
  const dateInput = document.getElementById('dateInput');
  const weightInput = document.getElementById('weightInput');
  const weightUnitLabel = document.getElementById('weightUnitLabel');
  const weightDelta = document.getElementById('weightDelta');
  const mealList = document.getElementById('mealList');
  const mealTime = document.getElementById('mealTime');
  const mealFood = document.getElementById('mealFood');
  const exerciseList = document.getElementById('exerciseList');
  const exerciseType = document.getElementById('exerciseType');
  const exerciseAmount = document.getElementById('exerciseAmount');
  const exerciseUnitLabel = document.getElementById('exerciseUnitLabel');
  const exerciseNote = document.getElementById('exerciseNote');

  function nowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function firstLoggedWeight() {
    const dates = DB.allDates();
    for (const d of dates) {
      const w = DB.getDay(d).weight;
      if (w != null) return { date: d, weight: w };
    }
    return null;
  }

  function renderToday() {
    dateInput.value = selectedDate;
    renderTopBar();

    const day = DB.getDay(selectedDate);
    weightUnitLabel.textContent = DB.raw().weightUnit;
    weightInput.value = day.weight != null ? day.weight : '';

    const first = firstLoggedWeight();
    if (day.weight != null && first && first.date !== selectedDate) {
      const delta = day.weight - first.weight;
      const sign = delta > 0 ? '+' : '';
      weightDelta.textContent = `${sign}${delta.toFixed(1)} ${DB.raw().weightUnit} vs first logged weight (${first.weight} on ${formatDateNice(first.date)})`;
    } else {
      weightDelta.textContent = '';
    }

    mealList.innerHTML = '';
    day.meals.forEach(m => {
      const row = document.createElement('div');
      row.className = 'entry-row';
      row.innerHTML = `
        <span class="entry-time">${m.time || ''}</span>
        <span class="entry-main entry-food">${escapeHtml(m.food)}</span>
        <button class="del-btn" aria-label="Delete">✕</button>`;
      row.querySelector('.del-btn').addEventListener('click', () => {
        DB.removeMeal(selectedDate, m.id);
        renderToday();
      });
      mealList.appendChild(row);
    });

    exerciseList.innerHTML = '';
    day.exercises.forEach(e => {
      const meta = EXERCISE_META[e.type] || EXERCISE_META.other;
      const row = document.createElement('div');
      row.className = 'entry-row';
      row.innerHTML = `
        <span class="entry-tag">${meta.icon} ${meta.label}</span>
        <span class="entry-main entry-value">${e.amount} ${meta.unit}${e.note ? ' — ' + escapeHtml(e.note) : ''}</span>
        <button class="del-btn" aria-label="Delete">✕</button>`;
      row.querySelector('.del-btn').addEventListener('click', () => {
        DB.removeExercise(selectedDate, e.id);
        renderToday();
      });
      exerciseList.appendChild(row);
    });

    mealTime.value = nowTime();
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  dateInput.addEventListener('change', () => {
    selectedDate = dateInput.value || DB.todayISO();
    renderToday();
  });
  document.getElementById('datePrev').addEventListener('click', () => {
    selectedDate = addDays(selectedDate, -1);
    renderToday();
  });
  document.getElementById('dateNext').addEventListener('click', () => {
    selectedDate = addDays(selectedDate, 1);
    renderToday();
  });
  document.getElementById('jumpToday').addEventListener('click', () => {
    selectedDate = DB.todayISO();
    renderToday();
  });

  weightInput.addEventListener('change', () => {
    DB.setWeight(selectedDate, weightInput.value);
    renderToday();
  });

  document.getElementById('addMeal').addEventListener('click', () => {
    const food = mealFood.value.trim();
    if (!food) return;
    DB.addMeal(selectedDate, mealTime.value, food);
    mealFood.value = '';
    renderToday();
  });
  mealFood.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('addMeal').click();
  });

  exerciseType.addEventListener('change', () => {
    const meta = EXERCISE_META[exerciseType.value];
    exerciseUnitLabel.textContent = meta.unit;
    exerciseNote.classList.toggle('hidden', exerciseType.value !== 'other');
  });

  document.getElementById('addExercise').addEventListener('click', () => {
    const amount = exerciseAmount.value;
    if (!amount || Number(amount) <= 0) return;
    DB.addExercise(selectedDate, exerciseType.value, amount, exerciseNote.value.trim());
    exerciseAmount.value = '';
    exerciseNote.value = '';
    renderToday();
  });

  // ---------- History view ----------
  function renderHistory() {
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    const dates = DB.allDates().sort().reverse();
    list.innerHTML = '';
    empty.classList.toggle('hidden', dates.length > 0);

    dates.forEach(dateStr => {
      const day = DB.getDay(dateStr);
      const exSummary = day.exercises.map(e => {
        const meta = EXERCISE_META[e.type] || EXERCISE_META.other;
        return `${meta.icon}${e.amount}`;
      }).join(' ');
      const parts = [];
      if (day.meals.length) parts.push(`${day.meals.length} meal${day.meals.length > 1 ? 's' : ''}`);
      if (exSummary) parts.push(exSummary);

      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-main">
          <span class="history-date">Day ${dayNumber(dateStr)} · ${formatDateNice(dateStr)}</span>
          <span class="history-sub">${parts.join(' · ') || 'No entries'}</span>
        </div>
        <span class="history-weight">${day.weight != null ? day.weight + ' ' + DB.raw().weightUnit : ''}</span>`;
      item.addEventListener('click', () => {
        selectedDate = dateStr;
        switchView('today');
      });
      list.appendChild(item);
    });
  }

  // ---------- Targets view ----------
  const startDateInput = document.getElementById('startDateInput');
  const weightUnitSelect = document.getElementById('weightUnitSelect');
  const targetSitups = document.getElementById('targetSitups');
  const targetPushups = document.getElementById('targetPushups');
  const targetPlank = document.getElementById('targetPlank');
  const targetRun = document.getElementById('targetRun');

  function renderTargetsView() {
    const data = DB.raw();
    startDateInput.value = data.startDate;
    weightUnitSelect.value = data.weightUnit;
    targetSitups.value = data.targets.situps || '';
    targetPushups.value = data.targets.pushups || '';
    targetPlank.value = data.targets.plankSeconds ? +(data.targets.plankSeconds / 60).toFixed(2) : '';
    targetRun.value = data.targets.kmRun || '';
  }

  startDateInput.addEventListener('change', () => {
    if (!startDateInput.value) return;
    DB.setStartDate(startDateInput.value);
    renderTopBar();
  });
  weightUnitSelect.addEventListener('change', () => {
    DB.setWeightUnit(weightUnitSelect.value);
    renderToday();
  });

  function saveTargets() {
    DB.setTargets({
      situps: Number(targetSitups.value) || 0,
      pushups: Number(targetPushups.value) || 0,
      plankSeconds: Math.round((Number(targetPlank.value) || 0) * 60),
      kmRun: Number(targetRun.value) || 0
    });
  }
  [targetSitups, targetPushups, targetPlank, targetRun].forEach(el => {
    el.addEventListener('change', saveTargets);
  });

  // ---------- Progress view ----------
  document.querySelectorAll('.metric-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMetric = btn.dataset.metric;
      document.querySelectorAll('.metric-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderTargetChart();
    });
  });

  function weeklyTotals(type) {
    const totals = new Array(TOTAL_WEEKS + 1).fill(0); // 1-indexed
    DB.allDates().forEach(dateStr => {
      const wn = weekNumber(dateStr);
      if (wn < 1 || wn > TOTAL_WEEKS) return;
      const day = DB.getDay(dateStr);
      day.exercises.forEach(e => {
        if (e.type === type) totals[wn] += e.amount;
      });
    });
    return totals;
  }

  function renderTargetChart() {
    const meta = EXERCISE_META[currentMetric];
    const targets = DB.raw().targets;
    let target = 0;
    let totals = weeklyTotals(currentMetric);
    let unit = meta.unit;

    if (currentMetric === 'plank') {
      target = (targets.plankSeconds || 0) / 60;
      totals = totals.map(v => v / 60);
      unit = 'min';
    } else if (currentMetric === 'situps') {
      target = targets.situps || 0;
    } else if (currentMetric === 'pushups') {
      target = targets.pushups || 0;
    } else if (currentMetric === 'run') {
      target = targets.kmRun || 0;
    }

    const bars = [];
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      bars.push({ label: 'W' + w, value: +totals[w].toFixed(1) });
    }

    const canvas = document.getElementById('targetChart');
    const empty = document.getElementById('targetChartEmpty');
    const hasAny = bars.some(b => b.value > 0) || target > 0;
    empty.classList.toggle('hidden', hasAny);
    if (hasAny) Charts.drawBarChart(canvas, bars, target);
    void unit;
  }

  function renderWeightChart() {
    const points = DB.allDates()
      .filter(d => DB.getDay(d).weight != null)
      .map(d => ({ x: dayNumber(d), y: DB.getDay(d).weight }))
      .sort((a, b) => a.x - b.x);

    const canvas = document.getElementById('weightChart');
    const empty = document.getElementById('weightChartEmpty');
    empty.classList.toggle('hidden', points.length > 0);
    if (points.length > 0) Charts.drawLineChart(canvas, points, CHALLENGE_LENGTH);
  }

  function currentStreak() {
    let streak = 0;
    let d = DB.todayISO();
    while (true) {
      const day = DB.getDay(d);
      const hasEntry = day.weight != null || day.meals.length || day.exercises.length;
      if (!hasEntry) break;
      streak++;
      d = addDays(d, -1);
    }
    return streak;
  }

  function renderStats() {
    const grid = document.getElementById('statGrid');
    const dates = DB.allDates();
    const first = firstLoggedWeight();
    const weighed = dates.filter(d => DB.getDay(d).weight != null).sort();
    const latest = weighed.length ? DB.getDay(weighed[weighed.length - 1]).weight : null;
    const delta = (first && latest != null) ? (latest - first.weight) : null;

    const stats = [
      { label: 'Days logged', value: dates.length },
      { label: 'Current streak', value: currentStreak() + (currentStreak() === 1 ? ' day' : ' days') },
      { label: 'Start weight', value: first ? first.weight + ' ' + DB.raw().weightUnit : '–' },
      { label: 'Weight change', value: delta != null ? (delta > 0 ? '+' : '') + delta.toFixed(1) + ' ' + DB.raw().weightUnit : '–' }
    ];

    grid.innerHTML = stats.map(s => `
      <div class="stat-box">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
  }

  function renderProgress() {
    renderStats();
    renderWeightChart();
    renderTargetChart();
  }

  window.addEventListener('resize', () => {
    if (document.getElementById('view-progress').classList.contains('active')) {
      renderWeightChart();
      renderTargetChart();
    }
  });

  // ---------- init ----------
  exerciseType.dispatchEvent(new Event('change'));
  renderTargetsView();
  renderToday();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
})();
