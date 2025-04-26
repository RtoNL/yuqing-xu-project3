import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { SHIPS, GAME_PHASES, GAME_MODES, PLAYERS } from "./constants";
import {
  createEmptyBoard,
  placeShipsRandomly,
  attackCell,
  checkGameOver,
  isShipSunk,
  canPlaceShip,
  placeShip,
} from "./utils/boardUtils";
import {
  saveGameState,
  loadGameState,
  clearGameState,
} from "./utils/storageUtils";
import { getSurroundingPositions } from "./utils/aiUtils";

// Create game context
const GameContext = createContext(null);

/**
 * Game Context Provider
 */
export const GameProvider = ({ children }) => {
  // Load saved game state
  const savedState = loadGameState();

  // Game phase state
  const [gamePhase, setGamePhase] = useState(
    savedState?.gamePhase || GAME_PHASES.SETUP
  );
  const [isGameActive, setIsGameActive] = useState(
    savedState?.isGameActive || false
  );
  const [winner, setWinner] = useState(savedState?.winner || null);
  const [gameMode, setGameModeState] = useState(
    savedState?.gameMode || GAME_MODES.NORMAL
  );
  const [gameStartTime, setGameStartTime] = useState(
    savedState?.gameStartTime || null
  );

  // Board state
  const [playerBoard, setPlayerBoard] = useState(
    savedState?.playerBoard || createEmptyBoard()
  );
  const [aiBoard, setAiBoard] = useState(
    savedState?.aiBoard || placeShipsRandomly()
  );

  // Ship state
  const [shipsToPlace, setShipsToPlace] = useState(
    savedState?.shipsToPlace || [...SHIPS]
  );
  const [selectedShip, setSelectedShip] = useState(null);
  const [placedShips, setPlacedShips] = useState(savedState?.placedShips || []);

  // AI state
  const [playerAttackedPositions] = useState(() => {
    const positions = new Set();
    if (savedState?.playerAttackedPositions) {
      savedState.playerAttackedPositions.forEach((pos) => positions.add(pos));
    }
    return positions;
  });

  const [aiAttackedPositions] = useState(() => {
    const positions = new Set();
    if (savedState?.aiAttackedPositions) {
      savedState.aiAttackedPositions.forEach((pos) => positions.add(pos));
    }
    return positions;
  });

  const [aiLastHit, setAiLastHit] = useState(savedState?.aiLastHit || null);
  const [aiTargetDirection, setAiTargetDirection] = useState(
    savedState?.aiTargetDirection || null
  );
  const [aiHitStack, setAiHitStack] = useState(savedState?.aiHitStack || []);

  // Update boards and check victory conditions
  const updateBoards = useCallback((newPlayerBoard, newAiBoard) => {
    setPlayerBoard([...newPlayerBoard]);
    setAiBoard([...newAiBoard]);

    // Check victory conditions
    if (checkGameOver(newAiBoard)) {
      setIsGameActive(false);
      setGamePhase(GAME_PHASES.OVER);
      setWinner(PLAYERS.HUMAN);
    } else if (checkGameOver(newPlayerBoard)) {
      setIsGameActive(false);
      setGamePhase(GAME_PHASES.OVER);
      setWinner(PLAYERS.AI);
    }
  }, []);

  // Select ship for placement
  const selectShip = useCallback(
    (ship) => {
      if (gamePhase !== GAME_PHASES.SETUP) return;
      setSelectedShip(ship);
    },
    [gamePhase]
  );

  // Place ship on the player's board
  const placePlayerShip = useCallback(
    (row, col) => {
      if (!selectedShip || gamePhase !== GAME_PHASES.SETUP) return false;

      const newBoard = [...playerBoard];
      const direction = "H"; // Simplified, only horizontal placement supported

      if (canPlaceShip(newBoard, row, col, selectedShip.size, direction)) {
        placeShip(newBoard, row, col, selectedShip, direction);
        setPlayerBoard(newBoard);

        // Remove from ships to place
        const remainingShips = shipsToPlace.filter(
          (s) => s.id !== selectedShip.id
        );
        setShipsToPlace(remainingShips);

        // Add to placed ships
        const updatedPlacedShips = [
          ...placedShips,
          {
            ...selectedShip,
            position: { row, col },
            direction,
          },
        ];
        setPlacedShips(updatedPlacedShips);

        // Clear selection
        setSelectedShip(null);

        // Check if all ships are placed
        if (remainingShips.length === 0) {
          console.log("All ships placed:", {
            total: SHIPS.length,
            placed: updatedPlacedShips.length,
            remaining: remainingShips.length,
          });

          // Game will transition to PLAYING in useEffect
        }

        return true;
      }

      return false;
    },
    [selectedShip, gamePhase, playerBoard, shipsToPlace, placedShips]
  );

  // Reset ship placement
  const resetShipPlacement = useCallback(() => {
    setPlayerBoard(createEmptyBoard());
    setShipsToPlace([...SHIPS]);
    setPlacedShips([]);
    setSelectedShip(null);
  }, []);

  // Determine AI attack strategy
  const determineAiAttack = useCallback(() => {
    // If there are previous hits, try to complete sinking the ship
    if (aiHitStack.length > 0) {
      const lastHit = aiHitStack[aiHitStack.length - 1];
      let surroundingPositions = getSurroundingPositions(
        lastHit.row,
        lastHit.col,
        aiAttackedPositions
      );

      // If we have a direction, prioritize that direction
      if (aiTargetDirection) {
        const dirPositions = surroundingPositions.filter(
          (pos) =>
            (pos.dr === aiTargetDirection.dr &&
              pos.dc === aiTargetDirection.dc) ||
            (pos.dr === -aiTargetDirection.dr &&
              pos.dc === -aiTargetDirection.dc)
        );

        if (dirPositions.length > 0) {
          surroundingPositions = dirPositions;
        }
      }

      if (surroundingPositions.length > 0) {
        const targetPos =
          surroundingPositions[
            Math.floor(Math.random() * surroundingPositions.length)
          ];

        aiAttackedPositions.add(`${targetPos.row},${targetPos.col}`);
        return {
          row: targetPos.row,
          col: targetPos.col,
          direction: { dr: targetPos.dr, dc: targetPos.dc },
        };
      }
    }

    // If no hits or no valid surrounding positions, random attack
    let row, col;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      attempts++;
      row = Math.floor(Math.random() * 10);
      col = Math.floor(Math.random() * 10);

      if (attempts >= maxAttempts) {
        console.warn("Too many AI attack attempts");
        break;
      }
    } while (aiAttackedPositions.has(`${row},${col}`));

    aiAttackedPositions.add(`${row},${col}`);
    return { row, col, direction: null };
  }, [aiHitStack, aiTargetDirection, aiAttackedPositions]);

  // AI turn
  const aiTurn = useCallback(() => {
    if (gameMode === GAME_MODES.EASY || !isGameActive) return;

    const { row, col, direction } = determineAiAttack();
    const newPlayerBoard = [...playerBoard];

    const hitShip = attackCell(newPlayerBoard, row, col);

    if (!hitShip) {
      // If missed and had a direction, try the opposite direction
      if (aiTargetDirection && aiHitStack.length > 0) {
        setAiTargetDirection({
          dr: -aiTargetDirection.dr,
          dc: -aiTargetDirection.dc,
        });
      }
    } else {
      // Hit a ship
      // Add to hit stack
      const newHitStack = [...aiHitStack, { row, col }];
      setAiHitStack(newHitStack);

      // If this is a second hit, determine direction
      if (aiLastHit && !aiTargetDirection) {
        setAiTargetDirection({
          dr: row - aiLastHit.row,
          dc: col - aiLastHit.col,
        });
      }

      // Update last hit
      setAiLastHit({ row, col });

      // Check if ship is sunk
      const cell = newPlayerBoard[row][col];
      if (cell?.id && isShipSunk(newPlayerBoard, cell.id)) {
        // Reset strategy
        setAiLastHit(null);
        setAiTargetDirection(null);
        setAiHitStack([]);
      }
    }

    updateBoards(newPlayerBoard, aiBoard);
  }, [
    gameMode,
    isGameActive,
    determineAiAttack,
    playerBoard,
    aiBoard,
    aiTargetDirection,
    aiHitStack,
    aiLastHit,
    updateBoards,
  ]);

  // Player attack
  const playerAttack = useCallback(
    (row, col) => {
      if (!isGameActive || playerAttackedPositions.has(`${row},${col}`)) return;

      playerAttackedPositions.add(`${row},${col}`);
      const newAiBoard = [...aiBoard];

      attackCell(newAiBoard, row, col);

      updateBoards(playerBoard, newAiBoard);

      // AI turn after short delay
      setTimeout(() => {
        aiTurn();
      }, 300);
    },
    [
      isGameActive,
      playerAttackedPositions,
      aiBoard,
      playerBoard,
      updateBoards,
      aiTurn,
    ]
  );

  // Set game mode
  const setGameMode = useCallback((mode) => {
    setGameModeState(mode);

    if (mode === GAME_MODES.EASY) {
      // In Easy mode, automatically place ships
      const newPlayerBoard = placeShipsRandomly();
      setPlayerBoard(newPlayerBoard);
      setPlacedShips(
        SHIPS.map((ship) => {
          // In Easy mode, we don't need real position information
          return { ...ship, position: { row: 0, col: 0 }, direction: "H" };
        })
      );
      setShipsToPlace([]);
      setGamePhase(GAME_PHASES.PLAYING);
      setIsGameActive(true);
      setGameStartTime(Date.now());
    }
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    clearGameState();

    // Reset all state
    setGamePhase(GAME_PHASES.SETUP);
    setIsGameActive(false);
    setWinner(null);
    setGameStartTime(null);

    setPlayerBoard(createEmptyBoard());
    setAiBoard(placeShipsRandomly());

    setShipsToPlace([...SHIPS]);
    setPlacedShips([]);
    setSelectedShip(null);

    playerAttackedPositions.clear();
    aiAttackedPositions.clear();

    setAiLastHit(null);
    setAiTargetDirection(null);
    setAiHitStack([]);
  }, [playerAttackedPositions, aiAttackedPositions]);

  // Start game when all ships are placed
  useEffect(() => {
    if (
      gamePhase === GAME_PHASES.SETUP &&
      shipsToPlace.length === 0 &&
      placedShips.length === SHIPS.length
    ) {
      setGamePhase(GAME_PHASES.PLAYING);
      setIsGameActive(true);
      setGameStartTime(Date.now());
    }
  }, [shipsToPlace, placedShips, gamePhase]);

  // Save game state
  useEffect(() => {
    // Don't save when game is over
    if (gamePhase === GAME_PHASES.OVER && winner) {
      clearGameState();
      return;
    }

    // Prepare state for saving
    const gameStateToSave = {
      gamePhase,
      playerBoard,
      aiBoard,
      isGameActive,
      winner,
      gameMode,
      gameStartTime,
      playerAttackedPositions: Array.from(playerAttackedPositions),
      aiAttackedPositions: Array.from(aiAttackedPositions),
      aiLastHit,
      aiTargetDirection,
      aiHitStack,
      shipsToPlace,
      placedShips,
    };

    saveGameState(gameStateToSave);
  }, [
    gamePhase,
    playerBoard,
    aiBoard,
    isGameActive,
    winner,
    gameMode,
    gameStartTime,
    playerAttackedPositions,
    aiAttackedPositions,
    aiLastHit,
    aiTargetDirection,
    aiHitStack,
    shipsToPlace,
    placedShips,
  ]);

  // Combine state and actions for context value
  const contextValue = {
    // Board state
    playerBoard,
    aiBoard,

    // Game state
    isGameActive,
    winner,
    gameMode,
    gameStartTime,
    gamePhase,

    // Ship placement state
    shipsToPlace,
    selectedShip,
    placedShips,

    // Actions
    resetGame,
    playerAttack,
    setGameMode,
    selectShip,
    placePlayerShip,
    resetShipPlacement,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

/**
 * Custom hook to use the game context
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
