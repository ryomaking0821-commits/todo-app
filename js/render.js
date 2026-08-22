const Render = (() => {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function priorityLabel(p) {
    return { low: "低", medium: "中", high: "高" }[p] || "";
  }

  function renderCategoryFilter(items, activeCategory) {
    const container = document.getElementById("category-filter");
    const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
    const chips = [{ label: "すべて", value: "" }, ...categories.map((c) => ({ label: c, value: c }))];
    container.innerHTML = chips
      .map(({ label, value }) => {
        const isActive = value === activeCategory;
        return `<button type="button" class="chip ${isActive ? "active" : ""}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  function renderTagFilter(items, activeTag) {
    const container = document.getElementById("tag-filter");
    if (!container) return;
    const tags = [...new Set(items.flatMap((i) => i.tags || []))].sort();
    if (tags.length === 0) {
      container.innerHTML = "";
      return;
    }
    const chips = [{ label: "すべてのタグ", value: "" }, ...tags.map((t) => ({ label: `#${t}`, value: t }))];
    container.innerHTML = chips
      .map(({ label, value }) => {
        const isActive = value === activeTag;
        return `<button type="button" class="chip ${isActive ? "active" : ""}" data-tag="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  function renderHistoryStrip(completions, days = 7) {
    const dates = DateUtils.lastNDates(days);
    return `<span class="history-strip">${dates
      .map((d) => `<span class="dot ${completions && completions[d] ? "filled" : ""}" title="${d}"></span>`)
      .join("")}</span>`;
  }

  function renderItemRow(item) {
    const done = Store.isDoneToday(item);
    const badges = [];
    if (item.category) badges.push(`<span class="badge category">${escapeHtml(item.category)}</span>`);
    if (item.priority) badges.push(`<span class="badge priority-${item.priority}">優先度: ${priorityLabel(item.priority)}</span>`);
    if (item.type === "task" && item.dueDate) {
      const daysLeft = DateUtils.daysUntil(item.dueDate);
      const urgency = daysLeft < 0 ? "overdue" : daysLeft === 0 ? "today" : daysLeft <= 2 ? "soon" : "";
      badges.push(
        `<span class="badge due ${urgency}">締切 ${escapeHtml(item.dueDate)}・${DateUtils.dueLabel(item.dueDate)}</span>`
      );
    }
    if (item.type === "routine" && item.weekdays && item.weekdays.length > 0) {
      const label = item.weekdays
        .slice()
        .sort()
        .map((d) => DateUtils.WEEKDAY_JA[d])
        .join("");
      badges.push(`<span class="badge weekday">${label}</span>`);
    }
    if (item.tags && item.tags.length) {
      badges.push(...item.tags.map((t) => `<span class="badge tag">#${escapeHtml(t)}</span>`));
    }

    let extra = "";
    if (item.type === "routine") {
      const streak = DateUtils.calcStreak(item.completions);
      extra = `<span class="streak-badge">🔥 ${streak}</span>${renderHistoryStrip(item.completions)}`;
    }

    return `
      <li class="item-row ${done ? "done" : "pending"}" data-id="${item.id}">
        <label class="check-wrap">
          <input type="checkbox" class="toggle-check" data-id="${item.id}" ${done ? "checked" : ""}>
          <span class="type-tag">${item.type === "routine" ? "日課" : "タスク"}</span>
        </label>
        <div class="item-body">
          <span class="title">${escapeHtml(item.title)}</span>
          <div class="badges">${badges.join("")}</div>
        </div>
        <div class="item-extra">${extra}</div>
        <div class="item-actions">
          <button type="button" class="icon-btn copy-btn" data-id="${item.id}" title="コピー" aria-label="コピー">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button type="button" class="icon-btn edit-btn" data-id="${item.id}" title="編集" aria-label="編集">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
          <button type="button" class="icon-btn delete-btn" data-id="${item.id}" title="削除" aria-label="削除">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </li>
    `;
  }

  function renderProgress(allItems) {
    const total = allItems.length;
    const done = allItems.filter((i) => Store.isDoneToday(i)).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById("progress-percent").textContent = `${percent}% (${done}/${total})`;
    document.getElementById("progress-fill").style.width = `${percent}%`;
  }

  function renderList(items) {
    const pending = items.filter((i) => !Store.isDoneToday(i));
    const done = items.filter((i) => Store.isDoneToday(i));

    const pendingEl = document.getElementById("pending-list");
    const doneEl = document.getElementById("done-list");
    const emptyEl = document.getElementById("empty-state");

    emptyEl.style.display = items.length === 0 ? "block" : "none";

    pendingEl.innerHTML = pending.length
      ? pending.map(renderItemRow).join("")
      : `<li class="empty-hint">今日やることはありません</li>`;
    doneEl.innerHTML = done.length
      ? done.map(renderItemRow).join("")
      : `<li class="empty-hint">まだ達成した項目はありません</li>`;

    document.getElementById("pending-count").textContent = pending.length;
    document.getElementById("done-count").textContent = done.length;
  }

  return { renderList, renderCategoryFilter, renderTagFilter, renderProgress, escapeHtml };
})();
