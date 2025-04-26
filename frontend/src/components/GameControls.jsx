import React from "react";
import { useGame } from "../context/GameContext.jsx";
import "../styles/GameControls.css";

/**
 * GameButton component - reusable styled button for game controls
 * @param {Object} props - Component props
 * @param {string} props.text - Button text
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS class names
 * @param {string} props.title - Tooltip text
 * @returns {JSX.Element} Rendered button component
 */
const GameButton = ({ text, onClick, className = "", title }) => {
  return (
    <button
      className={`game-button ${className}`}
      onClick={onClick}
      title={title}
    >
      {text}
    </button>
  );
};

/**
 * GameControls component - provides game control buttons
 * @returns {JSX.Element} Rendered game controls component
 */
const GameControls = () => {
  const { resetGame, winner } = useGame();

  const handleRestart = () => {
    // Could add confirmation dialog here in a real app
    resetGame();
  };

  const buttonText = winner ? "Play Again" : "Restart Game";
  const tooltipText = winner
    ? "Start a new game with the same settings"
    : "Reset the current game";

  return (
    <div className="game-controls">
      <GameButton
        text={buttonText}
        onClick={handleRestart}
        className="restart-button"
        title={tooltipText}
      />
    </div>
  );
};

export default GameControls;
