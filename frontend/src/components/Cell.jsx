import React from "react";
import "../styles/Cell.css";

const Cell = ({ value, onClick, className }) => {
  return (
    <div
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      {value}
    </div>
  );
};

export default Cell;
