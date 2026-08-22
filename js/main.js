const App = (() => {
  let activeCategory = "";
  let searchQuery = "";
  let sortMode = "created-desc";
  let currentDay = DateUtils.todayStr();

  function sortItems(items, mode) {
    const arr = items.slice();
    switch (mode) {
      case "priority": {
        const order = { high: 0, medium: 1, low: 2, "": 3 };
        arr.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
        break;
      }
      case "due":
        arr.sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"));
        break;
      case "title":
        arr.sort((a, b) => a.title.localeCompare(b.title, "ja"));
        break;
      case "created-desc":
      default:
        arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return arr;
  }

  function getFilteredItems(items) {
    let result = items;
    if (activeCategory) result = result.filter((i) => i.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }
    return sortItems(result, sortMode);
  }

  function updateReflectionDisplay() {
    const output = document.getElementById("reflection-output");
    output.classList.remove("error");
    output.textContent = Journal.getEntry(DateUtils.todayStr());
  }

  function refresh() {
    const allItems = Store.getItems();
    const todayStr = DateUtils.todayStr();
    const todayItems = allItems.filter((i) => Store.isScheduledOn(i, todayStr));
    document.getElementById("today-banner").textContent = `📅 ${DateUtils.formatJapaneseDate()}`;
    Render.renderProgress(todayItems);
    Render.renderCategoryFilter(allItems, activeCategory);
    Render.renderList(getFilteredItems(todayItems));
    Calendar.render();
    updateReflectionDisplay();
    Notify.checkAndNotify(todayItems);
  }

  function watchForDayChange() {
    setInterval(() => {
      const today = DateUtils.todayStr();
      if (today !== currentDay) {
        currentDay = today;
        refresh();
      }
      const todayStr = DateUtils.todayStr();
      Notify.checkAndNotify(Store.getItems().filter((i) => Store.isScheduledOn(i, todayStr)));
    }, 60 * 1000);
  }

  function onListClick(e) {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const copyBtn = e.target.closest(".copy-btn");
    if (editBtn) {
      const item = Store.getItems().find((i) => i.id === editBtn.dataset.id);
      if (item) FormUI.openForm(item);
      return;
    }
    if (copyBtn) {
      Store.duplicateItem(copyBtn.dataset.id);
      refresh();
      return;
    }
    if (deleteBtn) {
      if (confirm("この項目を削除しますか?")) {
        Store.deleteItem(deleteBtn.dataset.id);
        refresh();
      }
    }
  }

  function onListChange(e) {
    if (e.target.classList.contains("toggle-check")) {
      Store.toggleToday(e.target.dataset.id);
      refresh();
    }
  }

  function onCategoryClick(e) {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    refresh();
  }

  function initToolbar() {
    document.getElementById("search-input").addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      refresh();
    });
    document.getElementById("sort-select").addEventListener("change", (e) => {
      sortMode = e.target.value;
      refresh();
    });
  }

  function initNotify() {
    const timeInput = document.getElementById("reminder-time-input");
    timeInput.value = Notify.getReminderTime();
    timeInput.addEventListener("change", () => Notify.setReminderTime(timeInput.value));

    const statusEl = document.getElementById("reminder-status");
    function updateStatus() {
      if (!Notify.isSupported()) {
        statusEl.textContent = "この端末はブラウザ通知に対応していません。";
        return;
      }
      const p = Notify.permission();
      statusEl.textContent =
        p === "granted"
          ? "✅ 通知は有効です。"
          : p === "denied"
          ? "⚠ 通知がブロックされています。ブラウザの設定から許可してください。"
          : "通知はまだ許可されていません。";
    }
    updateStatus();

    document.getElementById("enable-notify-btn").addEventListener("click", async () => {
      await Notify.requestPermission();
      updateStatus();
    });
  }

  function initReflection() {
    document.getElementById("api-key-input").value = Journal.getApiKey();

    document.getElementById("settings-toggle").addEventListener("click", () => {
      const panel = document.getElementById("settings-panel");
      panel.style.display = panel.style.display === "none" ? "flex" : "none";
    });

    document.getElementById("save-key-btn").addEventListener("click", () => {
      const key = document.getElementById("api-key-input").value.trim();
      Journal.setApiKey(key);
      document.getElementById("settings-panel").style.display = "none";
    });

    document.getElementById("generate-reflection-btn").addEventListener("click", async () => {
      const btn = document.getElementById("generate-reflection-btn");
      const output = document.getElementById("reflection-output");
      output.classList.remove("error");
      btn.disabled = true;
      btn.textContent = "生成中...";
      try {
        await Journal.generateReflection(Store.getItems());
        updateReflectionDisplay();
        Calendar.render();
      } catch (err) {
        output.classList.add("error");
        output.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "今日の振り返りを生成";
      }
    });
  }

  function init() {
    FormUI.init();
    document.getElementById("pending-list").addEventListener("click", onListClick);
    document.getElementById("done-list").addEventListener("click", onListClick);
    document.getElementById("pending-list").addEventListener("change", onListChange);
    document.getElementById("done-list").addEventListener("change", onListChange);
    document.getElementById("category-filter").addEventListener("click", onCategoryClick);
    initToolbar();
    initNotify();
    initReflection();
    Calendar.init();
    Auth.init();
    watchForDayChange();
  }

  return { refresh, init };
})();

document.addEventListener("DOMContentLoaded", App.init);
