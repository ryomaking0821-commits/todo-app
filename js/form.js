const FormUI = (() => {
  let editingId = null;

  function init() {
    document.getElementById("add-btn").addEventListener("click", () => openForm(null));
    document.getElementById("item-form").addEventListener("submit", onSubmit);
    document.getElementById("cancel-btn").addEventListener("click", closeForm);
    document.querySelectorAll('input[name="type"]').forEach((el) =>
      el.addEventListener("change", updateDueDateVisibility)
    );
  }

  function updateDueDateVisibility() {
    const type = document.querySelector('input[name="type"]:checked').value;
    document.getElementById("due-date-field").style.display = type === "task" ? "flex" : "none";
  }

  function populateCategoryList() {
    const datalist = document.getElementById("category-list");
    const categories = [...new Set(Store.getItems().map((i) => i.category).filter(Boolean))].sort();
    datalist.innerHTML = categories.map((c) => `<option value="${Render.escapeHtml(c)}"></option>`).join("");
  }

  function openForm(item, prefill) {
    editingId = item ? item.id : null;
    const dialog = document.getElementById("item-dialog");
    const form = document.getElementById("item-form");
    form.reset();

    const defaultType = item ? item.type : prefill && prefill.dueDate ? "task" : "routine";
    document.getElementById("dialog-title").textContent = item ? "編集" : "追加";
    document.querySelectorAll('input[name="type"]').forEach((el) => {
      el.checked = el.value === defaultType;
      el.disabled = !!item;
    });

    document.getElementById("title-input").value = item ? item.title : "";
    document.getElementById("category-input").value = item ? item.category || "" : "";
    document.getElementById("tags-input").value = item && item.tags ? item.tags.join(", ") : "";
    document.getElementById("priority-input").value = item ? item.priority || "" : "";
    document.getElementById("notes-input").value = item ? item.notes || "" : "";
    document.getElementById("due-date-input").value = item
      ? item.type === "task"
        ? item.dueDate || ""
        : ""
      : (prefill && prefill.dueDate) || "";

    populateCategoryList();
    updateDueDateVisibility();
    dialog.showModal();
  }

  function closeForm() {
    document.getElementById("item-dialog").close();
    editingId = null;
  }

  function onSubmit(e) {
    e.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const title = document.getElementById("title-input").value.trim();
    if (!title) return;

    const data = {
      type,
      title,
      category: document.getElementById("category-input").value.trim(),
      tags: document
        .getElementById("tags-input")
        .value.split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      priority: document.getElementById("priority-input").value,
      notes: document.getElementById("notes-input").value.trim(),
      dueDate: document.getElementById("due-date-input").value,
    };

    if (editingId) {
      Store.updateItem(editingId, data);
    } else {
      Store.addItem(data);
    }

    closeForm();
    App.refresh();
  }

  return { init, openForm, closeForm };
})();
