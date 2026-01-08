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

function notifyHigh(text) {
  if (Notification.permission === "granted") {
    new Notification("🔥 High priority", { body: text });
  }
}

function render() {
  Object.values(columns).forEach(c => c.innerHTML = "");
  let highCount = 0;

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task " + t.priority;
    div.innerHTML = `
      <b>${t.text}</b>
      <small>${t.priority}</small>
    `;
    div.onclick = () => {
      t.status = t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo";
      saveTask(t);
      render();
    };
    columns[t.status].appendChild(div);
    if (t.priority === "high") highCount++;
  });

  badge.textContent = highCount || "";
}

addBtn.onclick = async () => {
  if (!input.value || tasks.length >= 100) return;

  const task = {
    id: Date.now(),
    text: input.value,
    priority: prioritySelect.value,
    status: "todo"
  };

  tasks.push(task);
  await saveTask(task);
  if (task.priority === "high") notifyHigh(task.text);
  input.value = "";
  render();
};

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
