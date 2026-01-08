const DB_NAME = 'task_planner_db';
const DB_VERSION = 2;
const STORE = 'boards';

let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      db = e.target.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = e => {
      db = e.target.result;
      resolve();
    };

    request.onerror = () => reject('DB error');
  });
}

export function saveBoard(board) {
  return new Promise(resolve => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(board);
    tx.oncomplete = resolve;
  });
}

export function getBoards() {
  return new Promise(resolve => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
  });
}
