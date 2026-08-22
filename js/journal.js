const Journal = (() => {
  const API_KEY_KEY = "taskdash:openai-key";

  function getApiKey() {
    return localStorage.getItem(API_KEY_KEY) || "";
  }

  function setApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
  }

  function getEntry(dateStr) {
    return Store.getJournalEntry(dateStr);
  }

  function buildSummary(items) {
    return items
      .map((item) => {
        const done = Store.isDoneToday(item);
        const kind = item.type === "routine" ? "日課" : "タスク";
        const status = done ? "達成" : "未達成";
        const category = item.category ? `(${item.category})` : "";
        const extra =
          item.type === "routine"
            ? `連続${DateUtils.calcStreak(item.completions)}日`
            : item.dueDate
            ? `締切${item.dueDate}`
            : "";
        return `- [${kind}/${status}] ${item.title}${category} ${extra}`.trim();
      })
      .join("\n");
  }

  function buildWeeklySummary(items, weekDates) {
    return weekDates
      .map((dateStr) => {
        const routines = items.filter(
          (i) => i.type === "routine" && i.createdAt.slice(0, 10) <= dateStr && Store.isScheduledOn(i, dateStr)
        );
        const routineDone = routines.filter((r) => r.completions && r.completions[dateStr]).length;
        const tasksDone = items.filter(
          (i) => i.type === "task" && (i.completionDates || []).includes(dateStr)
        ).length;
        return `- ${DateUtils.formatJapaneseDate(dateStr)}: 日課${routineDone}/${routines.length}達成、タスク完了${tasksDone}件`;
      })
      .join("\n");
  }

  async function generateWeeklyReflection(items) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが未設定です。「⚙ APIキー設定」から登録してください。");
    }
    if (items.length === 0) {
      throw new Error("まだ項目が登録されていません。");
    }

    const today = DateUtils.todayStr();
    const weekDates = DateUtils.datesInWeek(today).filter((d) => d <= today);
    const summary = buildWeeklySummary(items, weekDates);
    const prompt = `以下は今週(月曜〜今日)の日課・タスクの達成状況です。\n\n${summary}\n\nこれを踏まえて、今週一週間を振り返る短い日本語の文章(200〜300文字程度)を書いてください。良かった点をねぎらい、達成率が低い日があれば責めずに優しく触れ、最後に来週への一言を添えてください。温かいトーンでお願いします。`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`APIエラー (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message.content.trim()) || "";
    Store.saveJournalEntry(DateUtils.weekKey(today), text);
    return text;
  }

  async function generateReflection(items) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが未設定です。「⚙ APIキー設定」から登録してください。");
    }
    if (items.length === 0) {
      throw new Error("まだ項目が登録されていません。");
    }

    const summary = buildSummary(items);
    const prompt = `以下は今日の日課・タスクの達成状況です。\n\n${summary}\n\nこれを踏まえて、今日一日を振り返る短い日本語の文章(150〜250文字程度)を書いてください。達成できたことをねぎらい、未達成のものがあれば責めずに優しく触れ、最後に明日への一言を添えてください。温かいトーンでお願いします。`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`APIエラー (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message.content.trim()) || "";
    Store.saveJournalEntry(DateUtils.todayStr(), text);
    return text;
  }

  return { getApiKey, setApiKey, getEntry, generateReflection, generateWeeklyReflection };
})();
