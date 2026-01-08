/**
 * Простий wrapper над IndexedDB
 * Зберігає задачі локально на пристрої
 */

const DB_NAME = 'task_planner_db';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';

let db = null;

// Відкриття БД
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Помилка відкриття БД');

    request.onupgradeneeded = event => {
      db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const store = db.createObjectStore(STORE_TASKS, {
          keyPath: 'id'
        });

        store.createIndex('priority', 'priority');
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = event => {
      db = event.target.result;
      resolve(db);
    };
  });
}

// Додати задачу
export function addTask(task) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readwrite');
    const store = tx.objectStore(STORE_TASKS);
    store.add(task);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject('Не вдалося додати задачу');
  });
}

// Отримати всі задачі
export function getAllTasks() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, 'readonly');
    const store = tx.objectStore(STORE_TASKS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Не вдалося отримати задачі');
  });
}
