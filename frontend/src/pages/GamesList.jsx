import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const GamesList = () => {
  const [games, setGames] = useState({
    openGames: [],
    myOpenGames: [],
    myActiveGames: [],
    myCompletedGames: [],
    otherGames: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Move fetchGames outside useEffect and make it reusable
  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/games");
      const allGames = response.data;

      // Categorize games - ensure each game only appears in one category
      const categorizedGames = {
        openGames: [],
        myOpenGames: [],
        myActiveGames: [],
        myCompletedGames: [],
        otherGames: [],
      };

      // Create a Set to track processed game IDs
      const processedGames = new Set();

      allGames.forEach((game) => {
        // Skip if we've already processed this game
        if (processedGames.has(game._id)) return;
        processedGames.add(game._id);

        const isPlayer =
          user &&
          (game.player1?._id === user.id || game.player2?._id === user.id);

        if (game.status === "open") {
          if (isPlayer) {
            categorizedGames.myOpenGames.push(game);
          } else {
            categorizedGames.openGames.push(game);
          }
        } else if (game.status === "active") {
          if (isPlayer) {
            categorizedGames.myActiveGames.push(game);
          } else {
            categorizedGames.otherGames.push(game);
          }
        } else if (game.status === "completed") {
          if (isPlayer) {
            categorizedGames.myCompletedGames.push(game);
          } else {
            categorizedGames.otherGames.push(game);
          }
        }
      });

      setGames(categorizedGames);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError("Failed to fetch games. Please try again later.");
      toast.error("Failed to fetch games. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleJoinGame = async (gameId) => {
    try {
      const response = await axios.post(`/api/games/${gameId}/join`);
      if (response.data) {
        toast.success("Successfully joined the game!");
        navigate(`/game/${gameId}`);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to join game.";
      console.error("Error joining game:", errorMessage);
      toast.error(errorMessage);
      setError(errorMessage);

      // Refresh the games list to show updated status
      await fetchGames();
    }
  };

  const renderGameList = (title, gameList, options = {}) => (
    <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 bg-gray-100 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {gameList.length === 0 ? (
          <li className="px-4 py-4 text-sm text-gray-500 italic">
            No games in this category.
          </li>
        ) : (
          gameList.map((game) => (
            <li
              key={game._id}
              className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="text-sm font-medium text-gray-900 truncate">
                <Link
                  to={`/game/${game._id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Game ID: {game._id.substring(0, 8)}...
                </Link>
                {options.showOpponent && game.player1 && game.player2 && (
                  <span className="ml-4 text-gray-500">
                    Opponent:{" "}
                    {game.player1._id === user?.id
                      ? game.player2.username
                      : game.player1.username}
                  </span>
                )}
                {options.showPlayers && game.player1 && game.player2 && (
                  <span className="ml-4 text-gray-500">
                    Players: {game.player1.username} vs {game.player2.username}
                  </span>
                )}
                {options.showStartTime && (
                  <span className="ml-4 text-gray-500">
                    Started: {new Date(game.startTime).toLocaleString()}
                  </span>
                )}
                {options.showEndTime && game.endTime && (
                  <span className="ml-4 text-gray-500">
                    Ended: {new Date(game.endTime).toLocaleString()}
                  </span>
                )}
                {options.showWinner && game.winner && (
                  <span className="ml-4 text-gray-500 font-semibold">
                    Winner: {game.winner.username}
                  </span>
                )}
                {options.showMyResult && game.winner && (
                  <span
                    className={`ml-4 font-semibold ${
                      game.winner._id === user?.id
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {game.winner._id === user?.id ? "You Won" : "You Lost"}
                  </span>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                {options.showJoinButton && (
                  <button
                    onClick={() => handleJoinGame(game._id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Join Game
                  </button>
                )}
                {!options.showJoinButton && (
                  <Link
                    to={`/game/${game._id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    View Game
                  </Link>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  if (loading) {
    return <div className="p-8 text-center">Loading games...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Game Lobbies</h1>

        {user ? (
          // Logged In View
          <>
            {renderGameList("Open Games (Joinable)", games.openGames, {
              showStartTime: true,
              showJoinButton: true,
            })}
            {renderGameList(
              "My Open Games (Waiting for Opponent)",
              games.myOpenGames,
              { showStartTime: true }
            )}
            {renderGameList("My Active Games", games.myActiveGames, {
              showOpponent: true,
              showStartTime: true,
            })}
            {renderGameList("My Completed Games", games.myCompletedGames, {
              showOpponent: true,
              showStartTime: true,
              showEndTime: true,
              showMyResult: true,
            })}
            {renderGameList("Other Games", games.otherGames, {
              showPlayers: true,
              showStartTime: true,
              showEndTime: true,
              showWinner: true,
            })}
          </>
        ) : (
          // Logged Out View
          <>
            {renderGameList(
              "Active Games",
              games.otherGames.filter((g) => g.status === "active"),
              { showPlayers: true, showStartTime: true }
            )}
            {renderGameList(
              "Completed Games",
              games.otherGames.filter((g) => g.status === "completed"),
              {
                showPlayers: true,
                showStartTime: true,
                showEndTime: true,
                showWinner: true,
              }
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GamesList;
