/**
 * Checks if a position is valid on the board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} Whether the position is within the board
 */
export const isValidPosition = (row, col) => {
  return row >= 0 && row < 10 && col >= 0 && col < 10;
};

/**
 * Checks if a position has already been attacked
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {Set} attackedPositions - Set of attacked positions
 * @returns {boolean} Whether the position has been attacked
 */
export const isPositionAttacked = (row, col, attackedPositions) => {
  return attackedPositions.has(`${row},${col}`);
};

/**
 * Gets surrounding positions that can be attacked
 * @param {number} row - Center row
 * @param {number} col - Center column
 * @param {Set} attackedPositions - Set of already attacked positions
 * @returns {Array} Valid surrounding positions
 */
export const getSurroundingPositions = (row, col, attackedPositions) => {
  const directions = [
    { dr: -1, dc: 0 }, // Up
    { dr: 1, dc: 0 },  // Down
    { dr: 0, dc: -1 }, // Left
    { dr: 0, dc: 1 }   // Right
  ];
  
  return directions
    .map(dir => ({
      row: row + dir.dr,
      col: col + dir.dc,
      dr: dir.dr,
      dc: dir.dc
    }))
    .filter(pos => 
      isValidPosition(pos.row, pos.col) && 
      !isPositionAttacked(pos.row, pos.col, attackedPositions)
    );
}; 