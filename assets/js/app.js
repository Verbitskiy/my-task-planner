const taskInput = document.getElementById("taskText");
const prioritySelect = document.getElementById("taskPriority");
const addBtn = document.getElementById("addTaskBtn");
const list = document.getElementById("taskList");
const exportBtn = document.getElementById("exportBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

render();

/* ---------- SERVICE WORKER ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

/* ---------- NOTIFICATION PERMISSION ---------- */
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

/* ---------- ADD TASK ---------- */
addBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!text || tasks.length >= 100) return;

  tasks.push({
    id: Date.now(),
    text,
    priority
  });

  if (priority === "high") {
    notifyHighPriority(text);
  }

  save();
  taskInput.value = "";
});

/* ---------- EXPORT ---------- */
exportBtn.addEventListener("click", () => {
  const data = tasks.map(t => `[${t.priority}] ${t.text}`).join("\n");
  const blob = new Blob([data], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tasks.txt";
  link.click();
});

/* ---------- RENDER ---------- */
function render() {
  list.innerHTML = "";

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    return 0;
  });

  sorted.forEach(task => {
    const li = document.createElement("li");
    li.className = `task ${task.priority}`;
    li.innerHTML = `
      <span>${task.text}</span>
      <button onclick="removeTask(${task.id})">✕</button>
    `;
    list.appendChild(li);
  });
}

/* ---------- REMOVE ---------- */
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
}

/* ---------- SAVE ---------- */
function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

/* ---------- iOS HIGH PRIORITY NOTIFICATION ---------- */
function notifyHighPriority(text) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification("🔥 Високий пріоритет", {
    body: text
  });
}
