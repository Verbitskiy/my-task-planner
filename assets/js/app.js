import { openDB, addTask, getAllTasks } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  renderTasks();
});

async function renderTasks() {
  const tasks = await getAllTasks();
  const list = document.getElementById('task-list');

  list.innerHTML = '';

  tasks.forEach(task => {
    const item = document.createElement('li');
    item.textContent = `${task.title} (${task.priority})`;
    list.appendChild(item);
  });
}

window.createTask = async function () {
  const title = prompt('Назва задачі');
  if (!title) return;

  const priority = prompt('Пріоритет: low / medium / high', 'medium');

  const task = {
    id: crypto.randomUUID(),
    title,
    priority,
    createdAt: Date.now()
  };

  await addTask(task);
  renderTasks();
};
