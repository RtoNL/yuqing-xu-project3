import React from "react";
import { useGame } from "../context/GameContext.jsx";
import { canPlaceShip } from "../context/utils/boardUtils";
import "../styles/ShipPlacement.css";
import { toast } from "react-hot-toast";

/**
 * ShipItem component - Represents a selectable ship in the placement phase
 * @param {Object} props - Component props
 * @param {Object} props.ship - Ship data
 * @param {boolean} props.isSelected - Whether this ship is selected
 * @param {Function} props.onSelect - Selection handler
 * @returns {JSX.Element} Rendered ship item component
 */
const ShipItem = ({ ship, isSelected, onSelect }) => {
  return (
    <div
      className={`ship-item ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(ship)}
    >
      <div className="ship-visual">
        {Array.from({ length: ship.size }).map((_, index) => (
          <div key={index} className="ship-segment"></div>
        ))}
      </div>
      <div className="ship-info">
        <div className="ship-name">{ship.type}</div>
        <div className="ship-size">Size: {ship.size}</div>
      </div>
    </div>
  );
};

/**
 * ShipPlacement component - Manages the ship placement phase
 * @returns {JSX.Element} Rendered ship placement component
 */
const ShipPlacement = () => {
  const {
    playerBoard,
    shipsToPlace,
    selectedShip,
    placedShips,
    selectShip,
    placePlayerShip,
    resetShipPlacement,
  } = useGame();

  const handleCellClick = (row, col) => {
    if (!selectedShip) {
      toast.info("Please select a ship first");
      return;
    }

    const placed = placePlayerShip(row, col);
    if (!placed) {
      toast.error(
        "Cannot place ship at this position. Make sure it doesn't overlap with other ships and fits within the board."
      );
      return;
    }

    // If this was the last ship, show a success message
    if (shipsToPlace.length === 1) {
      toast.success("All ships placed! Game will start soon.");
    } else {
      toast.success(
        `${selectedShip.type} placed successfully! ${
          shipsToPlace.length - 1
        } ships remaining.`
      );
    }
  };

  return (
    <div className="ship-placement-container">
      <h2>Place Your Ships</h2>

      <div className="placement-instructions">
        <p>
          Click on a ship from the list, then click on the board to place it.
          Ships can only be placed horizontally.
        </p>
        <button className="reset-placement-button" onClick={resetShipPlacement}>
          Reset Placement
        </button>
      </div>

      <div className="placement-area">
        <div className="ships-container">
          <h3>Ships to Place: {shipsToPlace.length} remaining</h3>
          {shipsToPlace.length === 0 ? (
            <p className="all-placed-message">
              All ships placed! Game will start automatically.
            </p>
          ) : (
            <div className="ship-list">
              {shipsToPlace.map((ship, index) => (
                <ShipItem
                  key={index}
                  ship={ship}
                  isSelected={selectedShip && selectedShip.type === ship.type}
                  onSelect={selectShip}
                />
              ))}
            </div>
          )}

          <div className="placed-ships">
            <h3>Placed Ships: {placedShips.length}</h3>
            <ul className="placed-ships-list">
              {placedShips.map((ship, index) => (
                <li key={index}>
                  {ship.type} at position ({ship.position.row},{" "}
                  {ship.position.col})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="placement-board-container">
          <h3>Your Board</h3>
          <div className="placement-board">
            {playerBoard.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="board-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`board-cell ${cell ? "occupied" : "empty"} ${
                      selectedShip &&
                      canPlaceShip(
                        playerBoard,
                        rowIndex,
                        colIndex,
                        selectedShip.size,
                        "H"
                      )
                        ? "valid-placement"
                        : ""
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell && cell.id ? "S" : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipPlacement;
