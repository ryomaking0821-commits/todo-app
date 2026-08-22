const Store = (() => {
  const LOCAL_KEY = "taskdash:v1";
  const LOCAL_JOURNAL_KEY = "taskdash:journal:v1";

  let state = { version: 1, items: [], journal: {} };
  let uid = null;
  let unsubscribe = null;
  let onChangeCallback = () => {};

  function docRef() {
    const { db, doc } = window.Firebase;
    return doc(db, "users", uid);
  }

  function readLocalStorageData() {
    let items = [];
    let journal = {};
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) items = JSON.parse(raw).items || [];
    } catch {}
    try {
      const raw = localStorage.getItem(LOCAL_JOURNAL_KEY);
      if (raw) journal = JSON.parse(raw) || {};
    } catch {}
    return { version: 1, items, journal };
  }

  async function startSync(userId, onChange) {
    uid = userId;
    onChangeCallback = onChange || (() => {});
    const { getDoc, setDoc, onSnapshot } = window.Firebase;
    const ref = docRef();

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const localData = readLocalStorageData();
      const hasLocalData = localData.items.length > 0 || Object.keys(localData.journal).length > 0;
      const initial =
        hasLocalData && confirm("この端末に保存されていたデータをクラウドに移行しますか?")
          ? localData
          : { version: 1, items: [], journal: {} };
      await setDoc(ref, initial);
    }

    unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        state = { version: data.version || 1, items: data.items || [], journal: data.journal || {} };
        onChangeCallback();
      }
    });
  }

  function stopSync() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    uid = null;
    state = { version: 1, items: [], journal: {} };
  }

  function persist() {
    if (!uid) return;
    const { updateDoc } = window.Firebase;
    updateDoc(docRef(), { items: state.items, journal: state.journal });
  }

  function genId() {
    return crypto.randomUUID();
  }

  function getItems() {
    return state.items;
  }

  function addItem(data) {
    const item = {
      id: genId(),
      type: data.type,
      title: data.title,
      category: data.category || "",
      tags: data.tags || [],
      priority: data.priority || "",
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
    };
    if (item.type === "routine") {
      item.completions = {};
      item.weekdays = data.weekdays && data.weekdays.length ? data.weekdays : [];
    } else {
      item.dueDate = data.dueDate || "";
      item.done = false;
      item.completedAt = null;
      item.completionDates = [];
    }
    state.items.push(item);
    persist();
    return item;
  }

  function updateItem(id, data) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    item.title = data.title;
    item.category = data.category || "";
    item.tags = data.tags || [];
    item.priority = data.priority || "";
    item.notes = data.notes || "";
    if (item.type === "task") {
      item.dueDate = data.dueDate || "";
    } else {
      item.weekdays = data.weekdays && data.weekdays.length ? data.weekdays : [];
    }
    persist();
  }

  function deleteItem(id) {
    state.items = state.items.filter((i) => i.id !== id);
    persist();
  }

  function duplicateItem(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    return addItem({
      type: item.type,
      title: item.title,
      category: item.category,
      tags: item.tags,
      priority: item.priority,
      notes: item.notes,
      dueDate: item.dueDate,
      weekdays: item.weekdays,
    });
  }

  function isScheduledOn(item, dateStr) {
    if (item.type !== "routine") return true;
    if (!item.weekdays || item.weekdays.length === 0) return true;
    return item.weekdays.includes(DateUtils.weekdayOf(dateStr));
  }

  function toggleToday(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    if (item.type === "routine") {
      const today = DateUtils.todayStr();
      item.completions = item.completions || {};
      item.completions[today] = !item.completions[today];
    } else {
      item.done = !item.done;
      item.completedAt = item.done ? new Date().toISOString() : null;
      if (item.done) {
        const today = DateUtils.todayStr();
        item.completionDates = item.completionDates || [];
        if (!item.completionDates.includes(today)) {
          item.completionDates.push(today);
        }
      }
    }
    persist();
  }

  function isDoneToday(item) {
    if (item.type === "routine") {
      return !!(item.completions && item.completions[DateUtils.todayStr()]);
    }
    return !!item.done;
  }

  function getJournalEntry(dateStr) {
    return state.journal[dateStr] || "";
  }

  function saveJournalEntry(dateStr, text) {
    state.journal[dateStr] = text;
    persist();
  }

  return {
    startSync,
    stopSync,
    getItems,
    addItem,
    updateItem,
    deleteItem,
    duplicateItem,
    toggleToday,
    isDoneToday,
    isScheduledOn,
    getJournalEntry,
    saveJournalEntry,
  };
})();
