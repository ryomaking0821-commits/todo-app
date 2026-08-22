const Notify = (() => {
  const TIME_KEY = "taskdash:reminder-time";
  const LAST_KEY = "taskdash:reminder-last-notified";

  function getReminderTime() {
    return localStorage.getItem(TIME_KEY) || "";
  }

  function setReminderTime(t) {
    localStorage.setItem(TIME_KEY, t);
  }

  function getLastNotified() {
    return localStorage.getItem(LAST_KEY) || "";
  }

  function setLastNotified(dateStr) {
    localStorage.setItem(LAST_KEY, dateStr);
  }

  function isSupported() {
    return "Notification" in window;
  }

  function permission() {
    return isSupported() ? Notification.permission : "unsupported";
  }

  async function requestPermission() {
    if (!isSupported()) return "unsupported";
    return await Notification.requestPermission();
  }

  function checkAndNotify(items) {
    if (!isSupported() || Notification.permission !== "granted") return;
    const reminderTime = getReminderTime();
    if (!reminderTime) return;

    const today = DateUtils.todayStr();
    if (getLastNotified() === today) return;

    const now = new Date();
    const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (nowHM < reminderTime) return;

    const pending = items.filter((i) => !Store.isDoneToday(i));
    if (pending.length === 0) return;

    const names = pending.slice(0, 3).map((i) => i.title).join("、");
    new Notification("今日のタスク・日課", {
      body: `未達成が${pending.length}件あります: ${names}${pending.length > 3 ? " ほか" : ""}`,
      icon: "icons/icon-192.png",
    });
    setLastNotified(today);
  }

  return { getReminderTime, setReminderTime, isSupported, permission, requestPermission, checkAndNotify };
})();
