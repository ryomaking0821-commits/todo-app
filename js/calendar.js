const Calendar = (() => {
  let viewYear, viewMonth; // viewMonth: 0-11

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateStrOf(y, m, d) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  }

  function routineStatsForDate(items, dStr) {
    const routines = items.filter(
      (i) => i.type === "routine" && i.createdAt.slice(0, 10) <= dStr
    );
    const done = routines.filter((i) => i.completions && i.completions[dStr]).length;
    return { done, total: routines.length };
  }

  function tasksCompletedOn(items, dStr) {
    return items.filter((i) => i.type === "task" && (i.completionDates || []).includes(dStr));
  }

  function tasksDueOn(items, dStr) {
    return items.filter((i) => i.type === "task" && i.dueDate === dStr);
  }

  function render() {
    const items = Store.getItems();
    document.getElementById("cal-month-label").textContent = `${viewYear}年${viewMonth + 1}月`;

    const grid = document.getElementById("calendar-grid");
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = DateUtils.todayStr();

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(`<div class="cal-cell empty"></div>`);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = dateStrOf(viewYear, viewMonth, d);
      const isFuture = dStr > todayStr;
      const isToday = dStr === todayStr;
      const { done, total } = routineStatsForDate(items, dStr);
      const taskDoneCount = tasksCompletedOn(items, dStr).length;
      const dueCount = tasksDueOn(items, dStr).length;
      const hasJournal = !!Journal.getEntry(dStr);

      let level = "";
      if (!isFuture && total > 0) {
        const ratio = done / total;
        level = ratio === 1 ? "full" : ratio >= 0.5 ? "mid" : ratio > 0 ? "low" : "none";
      }

      cells.push(`
        <button type="button" class="cal-cell ${isToday ? "today" : ""} ${isFuture ? "future" : ""}"
          data-date="${dStr}">
          <span class="cal-date-num">${d}</span>
          <span class="cal-marks">
            ${!isFuture && total > 0 ? `<span class="cal-dot ${level}"></span>` : ""}
            ${!isFuture && taskDoneCount > 0 ? `<span class="cal-task-mark">✓${taskDoneCount}</span>` : ""}
            ${isFuture && dueCount > 0 ? `<span class="cal-due-mark">📌${dueCount}</span>` : ""}
            ${hasJournal ? `<span class="cal-journal-mark">🪶</span>` : ""}
          </span>
        </button>
      `);
    }

    grid.innerHTML = cells.join("");
    renderChart(items, daysInMonth, todayStr);
  }

  function renderChart(items, daysInMonth, todayStr) {
    const container = document.getElementById("achievement-chart");
    if (!container) return;

    const bars = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = dateStrOf(viewYear, viewMonth, d);
      if (dStr > todayStr) {
        bars.push(`<div class="chart-bar future" title="${d}日"></div>`);
        continue;
      }
      const { done, total } = routineStatsForDate(items, dStr);
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      bars.push(
        `<div class="chart-bar" style="height:${Math.max(pct, 3)}%" title="${d}日: 達成率${pct}%"></div>`
      );
    }
    container.innerHTML = bars.join("");
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    } else if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    render();
  }

  function onGridClick(e) {
    const cell = e.target.closest(".cal-cell[data-date]");
    if (!cell) return;
    openDayDetail(cell.dataset.date);
  }

  function renderDueList(dueTasks) {
    return dueTasks.length
      ? `<ul class="day-list">${dueTasks
          .map((t) => {
            const badge = t.category ? `(${Render.escapeHtml(t.category)})` : "";
            return `<li>📌 ${Render.escapeHtml(t.title)}${badge}</li>`;
          })
          .join("")}</ul>`
      : `<p class="day-empty">この日が締切のタスクはありません</p>`;
  }

  function openDayDetail(dStr) {
    const items = Store.getItems();
    const isFuture = dStr > DateUtils.todayStr();
    const dueTasks = tasksDueOn(items, dStr);
    const journalText = Journal.getEntry(dStr);

    document.getElementById("day-detail-title").textContent = DateUtils.formatJapaneseDate(dStr);

    const parts = [];

    if (isFuture) {
      parts.push(`<h3>締切のタスク</h3>`);
      parts.push(renderDueList(dueTasks));
      parts.push(
        `<button type="button" class="primary-btn small day-add-task-btn" data-date="${dStr}">+ この日を締切にタスクを追加</button>`
      );
      parts.push(`<p class="day-empty">この日はまだ来ていないため、日課の達成状況はまだ記録されていません。</p>`);
    } else {
      const routines = items.filter(
        (i) => i.type === "routine" && i.createdAt.slice(0, 10) <= dStr
      );
      const completedTasks = tasksCompletedOn(items, dStr);

      parts.push(`<h3>日課</h3>`);
      parts.push(
        routines.length
          ? `<ul class="day-list">${routines
              .map((r) => {
                const done = !!(r.completions && r.completions[dStr]);
                return `<li class="${done ? "done" : ""}">${done ? "✅" : "▫️"} ${Render.escapeHtml(r.title)}</li>`;
              })
              .join("")}</ul>`
          : `<p class="day-empty">この日はまだ日課が登録されていませんでした</p>`
      );

      parts.push(`<h3>完了したタスク</h3>`);
      parts.push(
        completedTasks.length
          ? `<ul class="day-list">${completedTasks
              .map((t) => `<li class="done">✅ ${Render.escapeHtml(t.title)}</li>`)
              .join("")}</ul>`
          : `<p class="day-empty">この日に完了したタスクはありません</p>`
      );

      if (dueTasks.length) {
        parts.push(`<h3>締切だったタスク</h3>`);
        parts.push(
          `<ul class="day-list">${dueTasks
            .map((t) => {
              const wasDone = (t.completionDates || []).some((cd) => cd <= dStr);
              return `<li class="${wasDone ? "done" : "overdue-text"}">${wasDone ? "✅" : "⚠️"} ${Render.escapeHtml(t.title)}</li>`;
            })
            .join("")}</ul>`
        );
      }
    }

    parts.push(`<h3>🪞 振り返り</h3>`);
    parts.push(
      journalText
        ? `<p class="day-journal">${Render.escapeHtml(journalText)}</p>`
        : `<p class="day-empty">この日の振り返りは記録されていません</p>`
    );

    document.getElementById("day-detail-body").innerHTML = parts.join("");
    document.getElementById("day-dialog").showModal();
  }

  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    document.getElementById("cal-prev").addEventListener("click", () => shiftMonth(-1));
    document.getElementById("cal-next").addEventListener("click", () => shiftMonth(1));
    document.getElementById("calendar-grid").addEventListener("click", onGridClick);
    document.getElementById("day-detail-close").addEventListener("click", () => {
      document.getElementById("day-dialog").close();
    });
    document.getElementById("day-detail-body").addEventListener("click", (e) => {
      const btn = e.target.closest(".day-add-task-btn");
      if (!btn) return;
      document.getElementById("day-dialog").close();
      FormUI.openForm(null, { dueDate: btn.dataset.date });
    });

    render();
  }

  return { init, render };
})();
