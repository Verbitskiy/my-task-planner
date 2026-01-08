const input = document.getElementById("taskInput");
const prioritySelect = document.getElementById("priority");
const addBtn = document.getElementById("addBtn");
const badge = document.getElementById("badge");

const columns = {
  todo: document.querySelector('[data-status="todo"] .list'),
  doing: document.querySelector('[data-status="doing"] .list'),
  done: document.querySelector('[data-status="done"] .list')
};

let tasks = [];

// --- Notification for high-priority tasks ---
function notifyHigh(text) {
  if (Notification.permission === "granted") {
    new Notification("🔥 High priority", { body: text });
  }
}

// --- Render all tasks ---
function render() {
  Object.values(columns).forEach(c => c.innerHTML = "");
  let highCount = 0;

  // Сортування: high зверху
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === b.status) {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
    }
    return 0;
  });

  sortedTasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task " + t.priority;
    div.innerHTML = `
      <b>${t.text}</b>
      <small>${t.priority}</small>

      <div class="subtasks">
        <ul>
          ${t.subtasks?.map((st, i) => `<li>
            <input type="checkbox" data-index="${i}" ${st.done ? "checked" : ""}>
            ${st.text}
          </li>`).join("") || ""}
        </ul>
        <input placeholder="Нова підзадача" class="subtask-input">
        <button class="add-subtask">＋</button>
      </div>

      <div class="comments">
        <ul>
          ${t.comments?.map(c => `<li>${c}</li>`).join("") || ""}
        </ul>
        <input placeholder="Коментар" class="comment-input">
        <button class="add-comment">＋</button>
      </div>
    `;

    // Зміна статусу при кліку на задачу
    div.querySelector("b").onclick = () => {
      t.status = t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo";
      saveTask(t);
      render();
    };

    // Додавання підзадач
    const addSubBtn = div.querySelector(".add-subtask");
    addSubBtn.onclick = () => {
      const subInput = div.querySelector(".subtask-input");
      if (!subInput.value) return;
      t.subtasks = t.subtasks || [];
      t.subtasks.push({ text: subInput.value, done: false });
      saveTask(t);
      render();
    };

    // Відмітка підзадач
    div.querySelectorAll(".subtasks input[type=checkbox]").forEach(checkbox => {
      checkbox.onchange = (e) => {
        const idx = e.target.dataset.index;
        t.subtasks[idx].done = e.target.checked;
        saveTask(t);
      };
    });

    // Додавання коментарів
    const addCommentBtn = div.querySelector(".add-comment");
    addCommentBtn.onclick = () => {
      const commentInput = div.querySelector(".comment-input");
      if (!commentInput.value) return;
      t.comments = t.comments || [];
      t.comments.push(commentInput.value);
      saveTask(t);
      render();
    };

    columns[t.status].appendChild(div);
    if (t.priority === "high") highCount++;
  });

  badge.textContent = highCount || "";
}

// --- Додавання нової задачі ---
addBtn.onclick = async () => {
  if (!input.value || tasks.length >= 100) return;

  const task = {
    id: Date.now(),
    text: input.value,
    priority: prioritySelect.value,
    status: "todo",
    subtasks: [],
    comments: []
  };

  tasks.push(task);
  await saveTask(task);

  if (task.priority === "high") notifyHigh(task.text);

  input.value = "";
  render();
};

// --- Ініціалізація ---
(async () => {
  tasks = await getAllTasks();
  render();

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
})();
