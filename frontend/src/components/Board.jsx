import React, { useState } from "react";
import Cell from "./Cell.jsx";
import "../styles/Board.css";

/**
 * Board component - renders the game board based on provided data and props.
 * @param {Object} props - Component props
 * @param {Array<Array<string>>} props.boardData - 10x10 array representing the board state.
 * @param {Function} props.onCellClick - Function to call when a cell is clicked (receives row, col).
 * @param {boolean} props.isInteractive - Whether the board should respond to clicks.
 * @param {boolean} props.isMyTurn - Whether it's the current player's turn (used for visual cues).
 * @param {boolean} props.isOpponentBoard - Whether this is the opponent's board.
 * @param {Object} props.selectedShip - The currently selected ship for placement.
 * @param {boolean} props.isHorizontal - Whether the ship is being placed horizontally.
 * @param {Function} props.getCellContent - Function to get the content of a cell.
 * @param {Object} props.lastMoveResult - The result of the last move.
 * @returns {JSX.Element} Rendered board component
 */
const Board = ({
  boardData = Array(10)
    .fill()
    .map(() => Array(10).fill("")),
  onCellClick,
  isInteractive = false,
  isMyTurn = false,
  isOpponentBoard = false,
  selectedShip = null,
  isHorizontal = true,
  getCellContent,
  lastMove = null,
}) => {
  const [previewRow, setPreviewRow] = useState(null);
  const [previewCol, setPreviewCol] = useState(null);

  if (
    !Array.isArray(boardData) ||
    boardData.length !== 10 ||
    !Array.isArray(boardData[0])
  ) {
    console.error("Invalid boardData received by Board component:", boardData);
    return <div>Error: Invalid board data</div>;
  }

  const isValidPlacement = (row, col) => {
    if (!selectedShip) return true;

    // Check if ship would fit on board
    if (isHorizontal) {
      if (col + selectedShip.size > 10) return false;
    } else {
      if (row + selectedShip.size > 10) return false;
    }

    // Check if cells are empty
    for (let i = 0; i < selectedShip.size; i++) {
      const checkRow = isHorizontal ? row : row + i;
      const checkCol = isHorizontal ? col + i : col;
      if (boardData[checkRow][checkCol] !== "") return false;
    }

    return true;
  };

  const getPreviewCells = (row, col) => {
    if (!selectedShip) return new Set();

    const cells = new Set();
    if (!isValidPlacement(row, col)) return cells;

    for (let i = 0; i < selectedShip.size; i++) {
      const previewRow = isHorizontal ? row : row + i;
      const previewCol = isHorizontal ? col + i : col;
      cells.add(`${previewRow}-${previewCol}`);
    }
    return cells;
  };

  const getCellClassName = (cellValue, row, col, previewCells) => {
    let className = "cell";

    if (previewCells.has(`${row}-${col}`)) {
      className += " preview";
      if (!isValidPlacement(row, col)) {
        className += " invalid";
      }
    } else if (cellValue === "hit") {
      className += " hit";
    } else if (cellValue === "miss") {
      className += " miss";
    } else if (!isOpponentBoard && cellValue === "ship") {
      className += " ship"; // Style player's own ships
    }

    // Add interactivity class if applicable
    if (isInteractive) {
      className += " interactive";
    }

    // Add last-move class if this cell was the last move
    if (lastMove && lastMove.row === row && lastMove.col === col) {
      className += ` ${lastMove.animation}`;
    }

    return className;
  };

  const handleCellClick = (row, col) => {
    if (isInteractive) {
      onCellClick(row, col);
    }
  };

  const previewCells =
    previewRow !== null && previewCol !== null
      ? getPreviewCells(previewRow, previewCol)
      : new Set();

  return (
    <div
      className={`board ${isMyTurn && isOpponentBoard ? "my-turn" : ""}`}
      onMouseLeave={() => {
        setPreviewRow(null);
        setPreviewCol(null);
      }}
    >
      {boardData.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="board-row">
          {row.map((cellValue, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={getCellContent(cellValue)}
              className={getCellClassName(
                cellValue,
                rowIndex,
                colIndex,
                previewCells
              )}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onMouseEnter={() => {
                if (selectedShip && isInteractive) {
                  setPreviewRow(rowIndex);
                  setPreviewCol(colIndex);
                }
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
