const taskInput = document.getElementById("taskText");
const prioritySelect = document.getElementById("taskPriority");
const addBtn = document.getElementById("addTaskBtn");
const list = document.getElementById("taskList");
const exportBtn = document.getElementById("exportBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

render();

addBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!text || tasks.length >= 100) return;

  tasks.push({
    id: Date.now(),
    text,
    priority
  });

  save();
  taskInput.value = "";
});

exportBtn.addEventListener("click", () => {
  const data = tasks.map(t => `[${t.priority}] ${t.text}`).join("\n");
  const blob = new Blob([data], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tasks.txt";
  link.click();
});

function render() {
  list.innerHTML = "";

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority === "high") return -1;
    if (b.priority === "high") return 1;
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

function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
}

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
