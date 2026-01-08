import { saveBoard, getBoards } from './db.js';

export function createDefaultBoard() {
  return {
    id: crypto.randomUUID(),
    title: 'Моя дошка',
    lists: [
      { id: 'todo', title: 'Заплановано', cards: [] },
      { id: 'doing', title: 'В процесі', cards: [] },
      { id: 'done', title: 'Виконано', cards: [] }
    ]
  };
}

export async function loadBoard() {
  const boards = await getBoards();

  if (boards.length > 0) return boards[0];

  const board = createDefaultBoard();
  await saveBoard(board);
  return board;
}

export function addCard(board, listId, card) {
  const list = board.lists.find(l => l.id === listId);
  list.cards.push(card);
  saveBoard(board);
}
