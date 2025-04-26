const BOARD_SIZE = 10;
const SHIP_TYPES = {
  CARRIER: { size: 5, name: "Carrier" },
  BATTLESHIP: { size: 4, name: "Battleship" },
  CRUISER: { size: 3, name: "Cruiser" },
  SUBMARINE: { size: 3, name: "Submarine" },
  DESTROYER: { size: 2, name: "Destroyer" },
};

// Ship configurations
const SHIPS = [
  { name: "carrier", size: 5 },
  { name: "battleship", size: 4 },
  { name: "cruiser", size: 3 },
  { name: "submarine", size: 3 },
  { name: "destroyer", size: 2 },
];

export const TOTAL_SHIP_CELLS = SHIPS.reduce((sum, ship) => sum + ship.size, 0);

// Create an empty board
export function createBoard() {
  return Array(10)
    .fill()
    .map(() => Array(10).fill(""));
}

// Check if a ship placement is valid
export function isValidPlacement(board, row, col, size, isHorizontal) {
  // Check if ship would go out of bounds
  if (isHorizontal) {
    if (col + size > 10) return false;
  } else {
    if (row + size > 10) return false;
  }

  // Only check for overlapping ships
  for (let i = 0; i < size; i++) {
    const checkRow = isHorizontal ? row : row + i;
    const checkCol = isHorizontal ? col + i : col;

    if (board[checkRow][checkCol] === "S") {
      return false;
    }
  }

  return true;
}

// Place a ship on the board
export function placeShip(board, row, col, size, isHorizontal) {
  if (!isValidPlacement(board, row, col, size, isHorizontal)) {
    throw new Error("Invalid ship placement");
  }

  for (let i = 0; i < size; i++) {
    if (isHorizontal) {
      board[row][col + i] = "S";
    } else {
      board[row + i][col] = "S";
    }
  }
}

// Place ships randomly on a board
export function placeShipsRandomly(board) {
  const ships = [5, 4, 3, 3, 2];
  console.log("Starting ship placement. Total cells needed:", TOTAL_SHIP_CELLS);

  for (const size of ships) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);
      const isHorizontal = Math.random() < 0.5;

      if (isValidPlacement(board, row, col, size, isHorizontal)) {
        placeShip(board, row, col, size, isHorizontal);
        placed = true;
        console.log(
          `✅ Placed ship size ${size} at [${row},${col}] ${
            isHorizontal ? "horizontal" : "vertical"
          }`
        );
      }

      attempts++;
    }

    if (!placed) {
      console.log(
        `❌ Failed to place ship size ${size} after ${attempts} attempts`
      );
      throw new Error(`Failed to place ship of size ${size}`);
    }
  }

  const shipCells = board.flat().filter((cell) => cell === "S").length;
  console.log(`\n🔍 Board validation:
  - Expected cells: ${TOTAL_SHIP_CELLS}
  - Actual cells: ${shipCells}
  - Board state:`);
  console.table(board);

  if (shipCells !== TOTAL_SHIP_CELLS) {
    throw new Error(
      `Ship placement validation failed: ${shipCells}/${TOTAL_SHIP_CELLS} cells placed`
    );
  }
}

// AI move logic
export function makeAIMove(previousMoves, playerBoard) {
  // First, look for hits to target adjacent cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (previousMoves[row][col] && playerBoard[row][col] === "S") {
        // Found a hit, check adjacent cells
        const directions = [
          [-1, 0], // up
          [1, 0], // down
          [0, -1], // left
          [0, 1], // right
        ];

        for (const [dx, dy] of directions) {
          const newRow = row + dx;
          const newCol = col + dy;

          if (
            newRow >= 0 &&
            newRow < 10 &&
            newCol >= 0 &&
            newCol < 10 &&
            !previousMoves[newRow][newCol]
          ) {
            return { row: newRow, col: newCol };
          }
        }
      }
    }
  }

  // If no hits found or no valid adjacent moves, make a random move
  // using a checkerboard pattern for efficiency
  const availableMoves = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!previousMoves[row][col] && (row + col) % 2 === 0) {
        availableMoves.push({ row, col });
      }
    }
  }

  // If no moves available in checkerboard pattern, try all remaining cells
  if (availableMoves.length === 0) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (!previousMoves[row][col]) {
          availableMoves.push({ row, col });
        }
      }
    }
  }

  // Return a random move from available moves
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}
