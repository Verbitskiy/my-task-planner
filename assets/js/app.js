import { openDB } from './db.js';
import { loadBoard, addCard } from './boards.js';

let board;

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  board = await loadBoard();
  renderBoard();
});

function renderBoard() {
  const root = document.getElementById('board');
  root.innerHTML = '';

  board.lists.forEach(list => {
    const col = document.createElement('div');
    col.className = 'column';

    col.innerHTML = `
      <h3>${list.title}</h3>
      <div class="cards">
        ${list.cards.map(renderCard).join('')}
      </div>
      <button onclick="addNewCard('${list.id}')">+ Додати</button>
    `;

    root.appendChild(col);
  });
}

function renderCard(card) {
  return `
    <div class="card priority-${card.priority}">
      ${card.title}
    </div>
  `;
}

window.addNewCard = function (listId) {
  const title = prompt('Назва задачі');
  if (!title) return;

  const priority = prompt('Пріоритет: low / medium / high', 'medium');

  addCard(board, listId, {
    id: crypto.randomUUID(),
    title,
    priority,
    createdAt: Date.now()
  });

  renderBoard();
};
