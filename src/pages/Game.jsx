import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import Board from "../components/Board"; // Assuming Board component exists and can be adapted
import { useAuth } from "../context/AuthContext";
import "../styles/Game.css"; // Assuming some styles exist
import { toast } from "react-hot-toast";
import { canPlaceShip } from "../context/utils/boardUtils";

const SHIPS = [
  { size: 5, name: "Carrier" },
  { size: 4, name: "Battleship" },
  { size: 3, name: "Cruiser" },
  { size: 3, name: "Submarine" },
  { size: 2, name: "Destroyer" },
];

// Helper function to check if a user is a participant in the game
const isParticipant = (game, userId) => {
  if (!game || !userId) return false;
  return (
    (game.player1 && game.player1._id === userId) ||
    (game.player2 && game.player2._id === userId)
  );
};

// Helper functions outside the component
const getCellContent = (cellValue, isOpponentBoard) => {
  if (cellValue === "hit") return "💥";
  if (cellValue === "miss") return "💦";
  if (!isOpponentBoard && cellValue === "S") return "🚢";
  return "";
};

const renderBoard = ({
  isOpponentBoard,
  boardData,
  onCellClick,
  interactive,
  title,
  myTurn,
  lastMove,
  selectedShip,
  isHorizontal,
  canPlaceShips,
  placedShips,
  setSelectedShip,
  setIsHorizontal,
  setPlacedShips,
  submitAllShips,
  isProcessingMove,
}) => {
  return (
    <div className="board-container w-full md:w-auto">
      <h2 className="text-lg font-semibold mb-2 text-center">{title}</h2>
      <div className="relative">
        <Board
          boardData={boardData}
          onCellClick={onCellClick}
          isInteractive={interactive}
          isMyTurn={myTurn}
          isOpponentBoard={isOpponentBoard}
          selectedShip={selectedShip}
          isHorizontal={isHorizontal}
          getCellContent={(cellValue) =>
            getCellContent(cellValue, isOpponentBoard)
          }
          lastMove={lastMove}
        />
        {isProcessingMove && isOpponentBoard && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
            <div className="text-lg font-semibold text-white">
              Processing move...
            </div>
          </div>
        )}
      </div>

      {/* Ship Placement UI - only for your board in setup phase */}
      {canPlaceShips && (
        <div className="mt-4 space-y-2 text-center">
          <div className="text-lg font-semibold">Place Your Ships</div>
          <div className="flex flex-wrap justify-center gap-2">
            {SHIPS.map((ship) => {
              const isPlaced = Object.values(placedShips).some(
                (s) => s.name === ship.name
              );
              return (
                <button
                  key={ship.name}
                  onClick={() => setSelectedShip(isPlaced ? null : ship)}
                  className={`px-3 py-1 rounded ${
                    isPlaced
                      ? "bg-gray-400 cursor-not-allowed"
                      : selectedShip?.name === ship.name
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  disabled={isPlaced}
                >
                  {ship.name} ({ship.size})
                </button>
              );
            })}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsHorizontal(!isHorizontal)}
              className="px-4 py-1 text-sm bg-indigo-500 text-white rounded"
            >
              Rotate Ship ({isHorizontal ? "Horizontal" : "Vertical"})
            </button>
            <button
              onClick={() => setPlacedShips({})}
              className="px-4 py-1 text-sm bg-red-500 text-white rounded"
              disabled={Object.keys(placedShips).length === 0}
            >
              Reset All Ships
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Ships placed: {Object.keys(placedShips).length}/5
          </div>
          {Object.keys(placedShips).length === 5 && (
            <button
              onClick={submitAllShips}
              className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Ships
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Game = () => {
  // State declarations
  const [game, setGame] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerLastMove, setPlayerLastMove] = useState(null);
  const [aiLastMove, setAiLastMove] = useState(null);
  const [isAIGame, setIsAIGame] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(-1);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Context and router hooks
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derived state
  const myTurn =
    game &&
    user &&
    game.currentTurn?._id?.toString() === user.id?.toString() &&
    game.status === "active";
  const statusMessage =
    game?.status === "setup"
      ? "Place Your Ships"
      : game?.status === "active"
      ? myTurn
        ? "Your Turn"
        : `${game?.currentTurn?.username || "Unknown"}'s Turn`
      : game?.status === "completed"
      ? game?.winner?._id === user?.id
        ? "You Won! 🎉"
        : "Game Over"
      : "Waiting...";

  // Helper functions
  const enrichGameData = useCallback((game) => {
    if (!game) return null;

    const player1 = game.players?.[0];
    const player2 = game.players?.[1];
    const currentTurnPlayer = game.players?.find(
      (p) => p.user?._id?.toString() === game.currentTurn?._id?.toString()
    );

    return {
      ...game,
      player1,
      player2,
      player1Ready: player1?.ships?.length === 5,
      player2Ready: player2?.ships?.length === 5,
      currentTurnName:
        currentTurnPlayer?.user?.username ||
        game.currentTurn?.username ||
        "Unknown",
    };
  }, []);

  // ✅ Define fetchGame before it's used in useEffect
  const fetchGame = useCallback(
    async (id) => {
      if (id === "new") {
        console.log("🛑 Skipping fetch for 'new' game ID");
        setLoading(false);
        return;
      }

      try {
        console.log(
          "📡 Fetching game from server:",
          id,
          "Retry count:",
          retryCount
        );
        const response = await axios.get(`/api/games/${id}`);
        console.log("📥 Server response:", response.data);

        const { success, game } = response.data;

        if (!success || !game || !game._id) {
          throw new Error("Game not found");
        }

        console.log("fetchGame response:", {
          gameId: game._id,
          status: game.status,
          currentTurn: game.currentTurn,
        });

        const enrichedGame = enrichGameData(game);
        setGame(enrichedGame);
        setIsAIGame(enrichedGame?.player2?.username === "AI_Player");
        setError("");
      } catch (err) {
        console.error("❌ Error fetching game:", err);

        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Network error. Please try again later.";

        if (status === 404 && retryCount < 3) {
          console.log("🔄 Retrying fetch...");
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchGame(id), 2000 * (retryCount + 1));
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [enrichGameData, retryCount]
  );

  // ✅ Now we can use fetchGame in useEffect
  useEffect(() => {
    if (!gameId || gameId === "new") {
      setLoading(false);
      return;
    }

    console.log("🧩 URL param gameId:", gameId);
    setLoading(true);
    fetchGame(gameId);
  }, [gameId, fetchGame]);

  // Add polling for game updates
  useEffect(() => {
    if (!gameId || gameId === "new") return;

    const interval = setInterval(() => {
      fetchGame(gameId);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [gameId, fetchGame]);

  // Game logic functions
  const handleCellClick = useCallback(
    async (row, col) => {
      if (!user || !game) {
        toast.error("Please log in to play");
        return;
      }

      if (isProcessingMove) {
        toast("Please wait, processing previous move...");
        return;
      }

      if (game.status !== "active") {
        toast.error("This game is not active");
        return;
      }

      if (!myTurn) {
        toast.error("It's not your turn!");
        return;
      }

      // Check if the cell has already been attacked
      const playerIndex = game.players.findIndex(
        (p) => p.user?._id?.toString() === user?.id?.toString()
      );
      const opponentIndex = playerIndex === 0 ? 1 : 0;
      if (game.players[playerIndex].moves[row][col]) {
        toast.error("You have already attacked this position!");
        return;
      }

      setIsProcessingMove(true);
      try {
        console.log("Making move:", {
          gameId: game._id,
          row,
          col,
          currentTurn: game.currentTurn?.username,
        });

        const response = await axios.post(`/api/games/${game._id}/move`, {
          row,
          col,
        });

        console.log("Move response:", {
          success: response.data.success,
          gameId: response.data.game?._id,
          hit: response.data.hit,
          gameOver: response.data.gameOver,
          hasAIMove: !!response.data.lastAIMove,
          status: response.data.game?.status,
        });

        if (!response.data.success) {
          const errorMessage = response.data.message || "Failed to make move";
          console.error("❌ Move failed:", errorMessage);
          toast.error(errorMessage);
          return;
        }

        const { game: updatedGame, hit, gameOver, lastAIMove } = response.data;

        if (!updatedGame) {
          console.error("❌ Invalid move response:", response.data);
          toast.error("Invalid game response from server");
          return;
        }

        const enriched = enrichGameData(updatedGame);
        console.log("Setting game state:", {
          gameId: enriched._id,
          status: enriched.status,
          currentTurn: enriched.currentTurn?.username,
        });

        setGame(enriched);

        setPlayerLastMove({
          row,
          col,
          isHit: hit,
          animation: hit ? "hit-animation" : "miss-animation",
        });

        if (hit) {
          toast.success("Direct hit! 🎯");
        } else {
          toast("Miss! 💦");
        }

        if (updatedGame.status === "completed") {
          const winner = updatedGame.winner?.username || "You";
          toast.success(`Game Over! ${winner} wins! 🎉`);
        }
      } catch (error) {
        console.error("Error making move:", error);
        toast.error(error.response?.data?.message || "Failed to make move");
      } finally {
        setIsProcessingMove(false);
      }
    },
    [game, user, myTurn, isProcessingMove, enrichGameData]
  );

  const handlePlaceShip = useCallback(
    async (row, col) => {
      if (!selectedShip) {
        toast("Please select a ship to place first");
        return;
      }

      if (placedShips[selectedShip.name]) {
        toast.error(`You have already placed the ${selectedShip.name}`);
        return;
      }

      // Check if ship would extend beyond board boundaries
      const endRow = row + (isHorizontal ? 0 : selectedShip.size - 1);
      const endCol = col + (isHorizontal ? selectedShip.size - 1 : 0);

      if (endRow >= 10 || endCol >= 10) {
        toast.error("Ship cannot be placed outside the board boundaries");
        return;
      }

      // Check for overlapping with other ships
      for (let i = 0; i < selectedShip.size; i++) {
        const checkRow = row + (isHorizontal ? 0 : i);
        const checkCol = col + (isHorizontal ? i : 0);

        for (const existingShip of Object.values(placedShips)) {
          const shipEndRow =
            existingShip.row +
            (existingShip.isHorizontal ? 0 : existingShip.size - 1);
          const shipEndCol =
            existingShip.col +
            (existingShip.isHorizontal ? existingShip.size - 1 : 0);

          // Check if current position overlaps with existing ship
          if (
            checkRow >= existingShip.row &&
            checkRow <= shipEndRow &&
            checkCol >= existingShip.col &&
            checkCol <= shipEndCol
          ) {
            toast.error("Ships cannot overlap");
            return;
          }
        }
      }

      setPlacedShips((prev) => ({
        ...prev,
        [selectedShip.name]: {
          name: selectedShip.name,
          size: selectedShip.size,
          row,
          col,
          isHorizontal,
        },
      }));

      setSelectedShip(null);

      const remainingShips = 5 - Object.keys(placedShips).length - 1;
      if (remainingShips > 0) {
        toast.success(
          `Placed ${selectedShip.name}! ${remainingShips} ship(s) to go.`
        );
      } else {
        toast.success("All ships placed! Please confirm placement.");
      }
    },
    [selectedShip, placedShips, isHorizontal]
  );

  const validateShipPlacements = useCallback((ships) => {
    if (!ships || !Array.isArray(ships)) {
      console.log("❌ Invalid ships array:", ships);
      return false;
    }

    // Check if we have exactly 5 ships
    if (ships.length !== 5) {
      console.log("❌ Wrong number of ships:", ships.length);
      return false;
    }

    // Check each ship's positions
    for (const ship of ships) {
      if (!ship.type || !Array.isArray(ship.positions)) {
        console.log("❌ Invalid ship structure:", ship);
        return false;
      }

      // Check if ship has the correct number of positions
      const expectedSize = SHIPS.find((s) => s.name === ship.type)?.size;
      if (!expectedSize || ship.positions.length !== expectedSize) {
        console.log("❌ Wrong number of positions for ship:", {
          type: ship.type,
          expected: expectedSize,
          actual: ship.positions.length,
        });
        return false;
      }

      // Check if all positions are within bounds and connected
      for (let i = 0; i < ship.positions.length; i++) {
        const pos = ship.positions[i];

        // Check bounds
        if (
          !pos ||
          typeof pos.row !== "number" ||
          typeof pos.col !== "number" ||
          pos.row < 0 ||
          pos.row >= 10 ||
          pos.col < 0 ||
          pos.col >= 10
        ) {
          console.log("❌ Position out of bounds:", pos);
          return false;
        }

        // Check if positions are connected (for positions after the first)
        if (i > 0) {
          const prevPos = ship.positions[i - 1];
          const isConnected =
            (Math.abs(pos.row - prevPos.row) === 1 &&
              pos.col === prevPos.col) || // Vertical
            (Math.abs(pos.col - prevPos.col) === 1 && pos.row === prevPos.row); // Horizontal

          if (!isConnected) {
            console.log("❌ Ship positions not connected:", {
              current: pos,
              previous: prevPos,
            });
            return false;
          }
        }
      }
    }

    // Check for overlapping positions
    const allPositions = new Set();
    for (const ship of ships) {
      for (const pos of ship.positions) {
        const posKey = `${pos.row},${pos.col}`;
        if (allPositions.has(posKey)) {
          console.log("❌ Overlapping positions detected at:", pos);
          return false;
        }
        allPositions.add(posKey);
      }
    }

    console.log("✅ All ship placements valid:", ships);
    return true;
  }, []);

  const submitAllShips = useCallback(async () => {
    const allShipsPlaced = SHIPS.every((ship) => placedShips[ship.name]);
    if (!allShipsPlaced) {
      toast.error("Please place all 5 ships before submitting.");
      return;
    }

    try {
      // Format ships data according to the backend's expected structure
      const shipsArray = SHIPS.map((ship) => {
        const placedShip = placedShips[ship.name];
        return {
          row: placedShip.row,
          col: placedShip.col,
          size: ship.size,
          isHorizontal: placedShip.isHorizontal,
        };
      });

      console.log("🚢 Attempting to submit ships:", {
        shipsArray,
        placedShips,
        SHIPS,
      });

      // Validate ship placements
      for (const ship of shipsArray) {
        // Check if ship would extend beyond board boundaries
        const endRow = ship.row + (ship.isHorizontal ? 0 : ship.size - 1);
        const endCol = ship.col + (ship.isHorizontal ? ship.size - 1 : 0);

        if (endRow >= 10 || endCol >= 10) {
          throw new Error(
            "Ship placement would extend beyond the board boundaries"
          );
        }

        // Check for overlapping with other ships
        for (let i = 0; i < ship.size; i++) {
          const checkRow = ship.row + (ship.isHorizontal ? 0 : i);
          const checkCol = ship.col + (ship.isHorizontal ? i : 0);

          // Check against all other ships
          for (const otherShip of shipsArray) {
            if (ship === otherShip) continue; // Skip self

            const otherEndRow =
              otherShip.row + (otherShip.isHorizontal ? 0 : otherShip.size - 1);
            const otherEndCol =
              otherShip.col + (otherShip.isHorizontal ? otherShip.size - 1 : 0);

            if (
              checkRow >= otherShip.row &&
              checkRow <= otherEndRow &&
              checkCol >= otherShip.col &&
              checkCol <= otherEndCol
            ) {
              throw new Error("Ships cannot overlap");
            }
          }
        }
      }

      console.log("📤 Submitting validated ships to server:", shipsArray);

      const response = await axios.post(`/api/games/${game._id}/place-ships`, {
        ships: shipsArray,
      });

      if (response.data.success) {
        setGame(enrichGameData(response.data.game));
        toast.success(
          "All ships placed successfully! Ready to start the game."
        );
      }
    } catch (error) {
      console.error("Error submitting ships:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit ships. Please try again.";
      toast.error(errorMessage);
      setPlacedShips({});
    }
  }, [game?._id, placedShips, enrichGameData]);

  const generateBoardWithShips = useCallback(() => {
    const board = Array(10)
      .fill(null)
      .map(() => Array(10).fill(""));
    Object.values(placedShips).forEach(({ row, col, size, isHorizontal }) => {
      for (let i = 0; i < size; i++) {
        const r = row + (isHorizontal ? 0 : i);
        const c = col + (isHorizontal ? i : 0);
        if (r < 10 && c < 10) {
          board[r][c] = "S";
        }
      }
    });
    return board;
  }, [placedShips]);

  // Update player identification when game or user changes
  useEffect(() => {
    if (game && user) {
      const currentPlayer = game.players?.find(
        (p) => p.user?._id?.toString() === user?.id?.toString()
      );
      const index = game.players?.indexOf(currentPlayer);
      setPlayerIndex(index);
      setIsPlayer1(index === 0);
      setIsPlayer(index !== -1);
      setIsPlayerReady(currentPlayer?.ships?.length === 5);
    }
  }, [game, user]);

  // Get player and opponent data
  const player = game?.players?.[playerIndex];
  const opponent = game?.players?.[playerIndex === 0 ? 1 : 0];
  const yourUsername = player?.user?.username || "You";
  const opponentUsername =
    opponent?.user?.username || "Waiting for opponent...";

  // Determine board data
  const yourBoardData = player?.board;
  const opponentBoardData = opponent?.board;
  const opponentMoves = game?.players?.[playerIndex]?.moves;

  // Create rendered board data that includes moves
  const renderedOpponentBoard = opponentBoardData?.map((row, i) =>
    row.map((cell, j) => {
      if (opponentMoves?.[i]?.[j]) {
        return cell === "S" ? "hit" : "miss";
      }
      return "";
    })
  );

  // Main render
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (gameId === "new") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <h2 className="text-2xl font-bold">Setting Up New Game</h2>
        <p className="text-gray-600">Preparing game setup...</p>
        <button
          onClick={() => navigate("/games")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Games List
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="text-xl text-red-600">{error}</div>
        <button
          onClick={() => navigate("/games")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Return to Games List
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="text-xl">Game not found.</div>
        <button
          onClick={() => navigate("/games")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Return to Games List
        </button>
      </div>
    );
  }

  // Add playerIndex validation check
  if (playerIndex === -1) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-xl">Waiting for player to join...</div>
      </div>
    );
  }

  return (
    <div className="game-container p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        Battleship Game
      </h1>
      <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">
        {statusMessage}
      </h2>

      {playerLastMove && (
        <div className="text-center mb-4">
          <p className="font-medium">
            Last move:{" "}
            {playerLastMove.isHit ? (
              <span className="text-red-600">Hit!</span>
            ) : (
              <span className="text-blue-600">Miss</span>
            )}{" "}
            at ({playerLastMove.row}, {playerLastMove.col})
          </p>
        </div>
      )}

      <div className="boards flex flex-col md:flex-row justify-center items-start gap-4 md:gap-8">
        {renderBoard({
          isOpponentBoard: true,
          boardData:
            game?.status === "active" && isPlayer
              ? renderedOpponentBoard
              : opponentBoardData,
          onCellClick: handleCellClick,
          interactive: isPlayer && myTurn,
          title: `Opponent's Board (${opponentUsername})`,
          myTurn,
          lastMove: playerLastMove,
          selectedShip,
          isHorizontal,
          canPlaceShips: false,
          placedShips,
          setSelectedShip,
          setIsHorizontal,
          setPlacedShips,
          submitAllShips,
          isProcessingMove,
        })}
        {renderBoard({
          isOpponentBoard: false,
          boardData:
            game?.status === "setup" && isPlayer && !isPlayerReady
              ? generateBoardWithShips()
              : yourBoardData,
          onCellClick:
            game?.status === "setup" && isPlayer && !isPlayerReady
              ? handlePlaceShip
              : handleCellClick,
          interactive:
            game?.status === "setup" ? isPlayer && !isPlayerReady : false,
          title: `Your Board (${yourUsername})`,
          myTurn,
          lastMove: aiLastMove,
          selectedShip,
          isHorizontal,
          canPlaceShips: game?.status === "setup" && isPlayer && !isPlayerReady,
          placedShips,
          setSelectedShip,
          setIsHorizontal,
          setPlacedShips,
          submitAllShips,
          isProcessingMove,
        })}
      </div>

      <div className="text-center mt-8 space-y-4">
        <button
          onClick={() => navigate("/games")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Games List
        </button>
        {game?.status === "completed" && (
          <p className="text-lg font-medium">
            {game?.winner?._id === user?.id ? (
              <span className="text-green-600">
                Congratulations! You won! 🎉
              </span>
            ) : (
              <span className="text-red-600">
                Game Over - Better luck next time!
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default Game;
