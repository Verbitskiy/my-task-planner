// --- Ініціалізація ---
const board = document.getElementById("board");
const addColumnBtn = document.getElementById("addColumnBtn");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("priority");
const addBtn = document.getElementById("addBtn");
const reminderInput = document.getElementById("reminder");
const columnSelect = document.getElementById("columnSelect");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");

const modal = document.getElementById("taskModal");
const closeModal = modal.querySelector(".close");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalPriority = document.getElementById("modalPriority");
const subtasksDiv = document.getElementById("subtasks");
const newSubtask = document.getElementById("newSubtask");
const addSubtaskBtn = document.getElementById("addSubtaskBtn");
const commentsDiv = document.getElementById("comments");
const newComment = document.getElementById("newComment");
const addCommentBtn = document.getElementById("addCommentBtn");
const uploadPhoto = document.getElementById("uploadPhoto");
const photosDiv = document.getElementById("photos");
const saveTaskBtn = document.getElementById("saveTaskBtn");

let columnsData = JSON.parse(localStorage.getItem("columnsData") || '{"todo":"До виконання","doing":"В процесі","done":"Завершено"}');
let tasks = [];
let draggedTaskId = null;
let currentTask = null;

// --- Колонки ---
function renderColumns() {
  board.innerHTML = "";
  columnSelect.innerHTML = "";
  for (const id in columnsData) {
    const colDiv = document.createElement("div");
    colDiv.className = "column";
    colDiv.dataset.id = id;
    colDiv.innerHTML = `<h2>${columnsData[id]}</h2><div class="list"></div>`;
    board.appendChild(colDiv);

    const option = document.createElement("option");
    option.value = id;
    option.textContent = columnsData[id];
    columnSelect.appendChild(option);

    // редагування назви
    const h2 = colDiv.querySelector("h2");
    h2.ondblclick = () => {
      const inp = document.createElement("input");
      inp.value = columnsData[id];
      h2.replaceWith(inp);
      inp.focus();
      inp.onblur = () => {
        columnsData[id] = inp.value || "Без назви";
        localStorage.setItem("columnsData", JSON.stringify(columnsData));
        renderColumns();
      };
    };
  }
}
renderColumns();

// --- Додавання колонки ---
addColumnBtn.onclick = () => {
  const id = "col_" + Date.now();
  columnsData[id] = "Нова колонка";
  localStorage.setItem("columnsData", JSON.stringify(columnsData));
  renderColumns();
};

// --- Push Notification ---
function notifyHigh(task) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const options = {
    body: task.text,
    tag: "high_" + task.id,
    renotify: true,
    requireInteraction: true,
    actions: [{ action: "done", title: "Виконано" }]
  };
  navigator.serviceWorker.getRegistration().then(reg => reg.showNotification("🔥 Високий пріоритет", options));
}

// --- Reminder ---
function scheduleReminder(task) {
  if (!task.reminder || task.status === "done") return;
  const delay = new Date(task.reminder) - new Date();
  setTimeout(() => {
    if (task.status !== "done") notifyHigh(task);
  }, delay > 0 ? delay : 0);
}

// --- Render tasks ---
function render() {
  for (const colId in columnsData) {
    const colDiv = board.querySelector(`.column[data-id="${colId}"] .list`);
    colDiv.innerHTML = "";
  }
  let highCount = 0;
  let filteredTasks = tasks.filter(t => {
    if (filterStatus.value !== "all" && t.status !== filterStatus.value) return false;
    if (filterPriority.value !== "all" && t.priority !== filterPriority.value) return false;
    return true;
  });

  filteredTasks.sort((a, b) => ({ "high": 0, "normal": 1, "low": 2 }[a.priority] - { "high": 0, "normal": 1, "low": 2 }[b.priority]));

  filteredTasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task " + t.priority;
    div.setAttribute("draggable", "true");
    div.dataset.id = t.id;
    div.innerHTML = `<b>${t.text}</b><small>${t.priority}</small>${t.reminder ? `<small>Нагадування: ${new Date(t.reminder).toLocaleString()}</small>` : ""}<button class="delete-btn">✕</button>`;

    // drag events
    div.addEventListener("dragstart", e => { draggedTaskId = t.id; div.classList.add("dragging"); });
    div.addEventListener("dragend", e => { draggedTaskId = null; div.classList.remove("dragging"); });

    // click => modal
    div.querySelector("b").onclick = () => openModal(t);

    // delete
    div.querySelector(".delete-btn").onclick = async () => {
      tasks = tasks.filter(task => task.id !== t.id);
      await deleteTask(t.id);
      render();
    };

    const colDiv = board.querySelector(`.column[data-id="${t.status}"] .list`);
    colDiv.appendChild(div);

    if (t.priority === "high") highCount++;
  });

  // drag drop columns
  for (const colId in columnsData) {
    const parent = board.querySelector(`.column[data-id="${colId}"]`);
    const list = parent.querySelector(".list");
    list.addEventListener("dragover", e => { e.preventDefault(); parent.classList.add("drag-over"); });
    list.addEventListener("dragleave", e => parent.classList.remove("drag-over"));
    list.addEventListener("drop", e => {
      e.preventDefault(); parent.classList.remove("drag-over");
      if (!draggedTaskId) return;
      const task = tasks.find(t => t.id == draggedTaskId);
      task.status = colId;
      saveTask(task); render();
    });
  }

  document.getElementById("badge").textContent = highCount || "";
}

// --- Modal ---
function openModal(task) {
  currentTask = task;
  modal.style.display = "flex";
  modalTitle.textContent = task.text;
  modalText.value = task.text;
  modalPriority.value = task.priority;

  // subtasks
  subtasksDiv.innerHTML = "";
  task.subtasks = task.subtasks || [];
  task.subtasks.forEach((st, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<input type="checkbox" ${st.done ? "checked" : ""}> ${st.text} <button data-index="${i}">✕</button>`;
    div.querySelector("input").onchange = e => { st.done = e.target.checked; saveTask(task); render(); };
    div.querySelector("button").onclick = () => { task.subtasks.splice(i, 1); saveTask(task); render(); openModal(task); };
    subtasksDiv.appendChild(div);
  });

  // comments
  commentsDiv.innerHTML = "";
  task.comments = task.comments || [];
  task.comments.forEach((c, i) => {
    const div = document.createElement("div");
    div.innerHTML = `${c} <button data-index="${i}">✕</button>`;
    div.querySelector("button").onclick = () => { task.comments.splice(i, 1); saveTask(task); render(); openModal(task); };
    commentsDiv.appendChild(div);
  });

  // photos
  photosDiv.innerHTML = "";
  task.photos = task.photos || [];
  task.photos.forEach((p, i) => {
    const img = document.createElement("img"); img.src = p; img.style.maxWidth = "100%"; img.style.marginBottom = "4px";
    photosDiv.appendChild(img);
  });
}

closeModal.onclick = () => { modal.style.display = "none"; currentTask = null; };
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; currentTask = null; };

// --- Add task ---
addBtn.onclick = async () => {
  if (!taskInput.value || tasks.length >= 100) return;
  const task = {
    id: Date.now(),
    text: taskInput.value,
    priority: prioritySelect.value,
    status: columnSelect.value,
    subtasks: [],
    comments: [],
    photos: [],
    reminder: reminderInput.value ? new Date(reminderInput.value).toISOString() : null
  };
  tasks.push(task);
  await saveTask(task);
  if (task.priority === "high") notifyHigh(task);
  scheduleReminder(task);
  taskInput.value = ""; reminderInput.value = "";
  render();
};

// --- Modal add subtask/comment/photo ---
addSubtaskBtn.onclick = () => {
  if (!newSubtask.value) return;
  currentTask.subtasks.push({ text: newSubtask.value, done: false });
  saveTask(currentTask);
  newSubtask.value = "";
  openModal(currentTask);
};

addCommentBtn.onclick = () => {
  if (!newComment.value) return;
  currentTask.comments.push(newComment.value);
  saveTask(currentTask);
  newComment.value = "";
  openModal(currentTask);
};

uploadPhoto.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { currentTask.photos.push(reader.result); saveTask(currentTask); openModal(currentTask); };
  reader.readAsDataURL(file);
};

saveTaskBtn.onclick = () => {
  currentTask.text = modalText.value;
  currentTask.priority = modalPriority.value;
  saveTask(currentTask);
  render();
  modal.style.display = "none";
  currentTask = null;
};

// --- Filters ---
filterStatus.onchange = render;
filterPriority.onchange = render;

// --- Init ---
(async () => {
  tasks = await getAllTasks();
  tasks.forEach(t => scheduleReminder(t));
  render();

  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
})();
