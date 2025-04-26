import { SHIPS } from "../constants";

/**
 * Creates an empty 10x10 board
 * @returns {Array} Empty 10x10 board
 */
export const createEmptyBoard = () =>
  Array.from({ length: 10 }, () => Array(10).fill(null));

/**
 * Checks if a ship can be placed at the specified position
 * @param {Array} board - The game board
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {number} size - Ship size
 * @param {string} direction - Ship direction ('H' or 'V')
 * @returns {boolean} Whether the ship can be placed
 */
export const canPlaceShip = (board, row, col, size, direction) => {
  // Check boundaries
  if (direction === "H" && col + size > 10) return false;
  if (direction === "V" && row + size > 10) return false;

  // Check for overlaps with existing ships
  if (direction === "H") {
    for (let i = 0; i < size; i++) {
      if (board[row][col + i] !== null && board[row][col + i] !== "")
        return false;
    }
  } else {
    // Vertical
    for (let i = 0; i < size; i++) {
      if (board[row + i][col] !== null && board[row + i][col] !== "")
        return false;
    }
  }

  // Validate total ship count (optional)
  let totalShips = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (board[r][c] !== null && board[r][c] !== "") totalShips++;
    }
  }

  // Maximum of 17 ship cells allowed (5+4+3+3+2)
  if (totalShips + size > 17) {
    console.warn(
      "Placing this ship would exceed the maximum allowed ship cells (17)"
    );
    return false;
  }

  return true;
};

/**
 * Places a ship on the board
 * @param {Array} board - The game board
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {Object} ship - Ship object with size and id
 * @param {string} direction - Ship direction ('H' or 'V')
 */
export const placeShip = (board, row, col, ship, direction) => {
  if (direction === "H") {
    for (let i = 0; i < ship.size; i++) {
      board[row][col + i] = { id: ship.id, hit: false };
    }
  } else {
    // Vertical
    for (let i = 0; i < ship.size; i++) {
      board[row + i][col] = { id: ship.id, hit: false };
    }
  }
};

/**
 * Randomly places ships on the board
 * @returns {Array} Board with randomly placed ships
 */
export const placeShipsRandomly = () => {
  const board = createEmptyBoard();

  // Ensure board is clean
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      board[row][col] = null;
    }
  }

  SHIPS.forEach((ship) => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (!placed && attempts < maxAttempts) {
      attempts++;
      let row = Math.floor(Math.random() * 10);
      let col = Math.floor(Math.random() * 10);
      let direction = Math.random() < 0.5 ? "H" : "V";

      if (canPlaceShip(board, row, col, ship.size, direction)) {
        placeShip(board, row, col, ship, direction);
        placed = true;
      }
    }

    if (!placed) {
      console.warn(`Unable to place ship of size ${ship.size}, skipping`);
    }
  });

  return board;
};

/**
 * Checks if the game is over
 * @param {Array} board - The game board
 * @returns {boolean} Whether all ships are sunk
 */
export const checkGameOver = (board) => {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell && cell.id && !cell.hit) {
        return false; // At least one ship still intact
      }
    }
  }
  return true; // All ships are hit
};

/**
 * Checks if a ship is sunk
 * @param {Array} board - The game board
 * @param {string} shipId - ID of ship to check
 * @returns {boolean} Whether the ship is completely sunk
 */
export const isShipSunk = (board, shipId) => {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell && cell.id === shipId && !cell.hit) {
        return false; // Ship still has unhit parts
      }
    }
  }
  return true; // All parts of the ship are hit
};

/**
 * Marks a cell as hit
 * @param {Array} board - The game board to update
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} Whether a ship was hit
 */
export const attackCell = (board, row, col) => {
  if (board[row][col] === null) {
    // Miss
    board[row][col] = { id: null, hit: true, miss: true };
    return false;
  } else if (board[row][col] && board[row][col].id) {
    // Hit ship
    board[row][col].hit = true;
    return true;
  }
  return false;
};
