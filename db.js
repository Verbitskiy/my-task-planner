const DB_NAME = "tasksDB";
const STORE = "tasks";

function openDB() {
  return new Promise((res) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = e => res(e.target.result);
  });
}

async function getAllTasks() {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction(STORE);
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });
}

async function saveTask(task) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(task);
}

async function deleteTask(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
}
