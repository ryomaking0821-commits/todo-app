const App = (() => {
  let activeCategory = "";
  let currentDay = DateUtils.todayStr();

  function getFilteredItems() {
    const items = Store.getItems();
    if (!activeCategory) return items;
    return items.filter((i) => i.category === activeCategory);
  }

  function updateReflectionDisplay() {
    const output = document.getElementById("reflection-output");
    output.classList.remove("error");
    output.textContent = Journal.getEntry(DateUtils.todayStr());
  }

  function refresh() {
    const items = Store.getItems();
    document.getElementById("today-banner").textContent = `📅 ${DateUtils.formatJapaneseDate()}`;
    Render.renderProgress(items);
    Render.renderCategoryFilter(items, activeCategory);
    Render.renderList(getFilteredItems());
    Calendar.render();
    updateReflectionDisplay();
  }

  function watchForDayChange() {
    setInterval(() => {
      const today = DateUtils.todayStr();
      if (today !== currentDay) {
        currentDay = today;
        refresh();
      }
    }, 60 * 1000);
  }

  function onListClick(e) {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    if (editBtn) {
      const item = Store.getItems().find((i) => i.id === editBtn.dataset.id);
      if (item) FormUI.openForm(item);
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
    initReflection();
    Calendar.init();
    Auth.init();
    watchForDayChange();
  }

  return { refresh, init };
})();

document.addEventListener("DOMContentLoaded", App.init);
