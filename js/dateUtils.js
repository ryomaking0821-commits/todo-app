const DateUtils = (() => {
  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayStr() {
    return formatDate(new Date());
  }

  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return formatDate(dt);
  }

  function lastNDates(n, endDateStr = todayStr()) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      dates.push(addDays(endDateStr, -i));
    }
    return dates;
  }

  function calcStreak(completions, todayDateStr = todayStr()) {
    if (!completions) return 0;
    let cursor = todayDateStr;
    if (!completions[cursor]) {
      cursor = addDays(cursor, -1);
    }
    let streak = 0;
    while (completions[cursor]) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

  function formatJapaneseDate(dateStr = todayStr()) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return `${y}年${m}月${d}日(${WEEKDAY_JA[dt.getDay()]})`;
  }

  function weekdayOf(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  function daysUntil(dateStr, fromDateStr = todayStr()) {
    const [y1, m1, d1] = fromDateStr.split("-").map(Number);
    const [y2, m2, d2] = dateStr.split("-").map(Number);
    const from = Date.UTC(y1, m1 - 1, d1);
    const to = Date.UTC(y2, m2 - 1, d2);
    return Math.round((to - from) / 86400000);
  }

  function dueLabel(dateStr) {
    const n = daysUntil(dateStr);
    if (n === 0) return "今日締切";
    if (n > 0) return `あと${n}日`;
    return `${-n}日超過`;
  }

  return {
    formatDate,
    todayStr,
    addDays,
    lastNDates,
    calcStreak,
    formatJapaneseDate,
    daysUntil,
    dueLabel,
    weekdayOf,
    WEEKDAY_JA,
  };
})();
