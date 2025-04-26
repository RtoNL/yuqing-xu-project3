import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const Games = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesResponse = await axios.get("/games");

        if (gamesResponse.data && gamesResponse.data.success) {
          setGames(gamesResponse.data.games || []);
        } else {
          console.error("Invalid games response format:", gamesResponse.data);
          setGames([]);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
        toast.error("Failed to load games");
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [isAuthenticated]);

  // Filter joinable games on the frontend
  const joinableGames = games.filter(
    (game) =>
      game.status === "open" &&
      game.players?.length < 2 &&
      !game.players?.some((p) => p.user?._id === user?.id)
  );

  // Update the filtering logic for other game categories
  const myOpenGames = games.filter(
    (game) =>
      game.status === "open" &&
      game.players?.some((p) => p.user?._id === user?.id)
  );

  const myActiveGames = games.filter(
    (game) =>
      (game.status === "active" || game.status === "setup") &&
      game.players?.some((p) => p.user?._id === user?.id)
  );

  const myCompletedGames = games.filter(
    (game) =>
      game.status === "completed" &&
      game.players?.some((p) => p.user?._id === user?.id)
  );

  const otherGames = games.filter(
    (game) =>
      !game.players?.some((p) => p.user?._id === user?.id) &&
      game.status !== "open"
  );

  // For logged out users
  const activeGames = games.filter(
    (game) => game.status === "active" && game.players?.length === 2
  );
  const completedGames = games.filter((game) => game.status === "completed");

  const handleJoinGame = async (gameId) => {
    try {
      const response = await axios.post(`/games/${gameId}/join`);
      if (response.data.success) {
        toast.success("Successfully joined the game!");
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to join game";
      toast.error(errorMessage);
    }
  };

  const handleCreateGame = async () => {
    try {
      const response = await axios.post("/games/create");
      console.log("🎮 Creating new game:", response.data);

      const { success, game } = response.data;

      if (!success || !game) {
        throw new Error("Invalid response format");
      }

      if (!game._id) {
        throw new Error("Game created but no ID received");
      }

      toast.success("Game created! Waiting for opponent...");
      navigate(`/game/${game._id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create game. Please try again."
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const GameCard = ({ game, showJoinButton = false }) => {
    const player1 = game.players?.[0]?.user;
    const player2 = game.players?.[1]?.user;

    const canJoin =
      game.status === "open" &&
      game.players?.length < 2 &&
      !game.players?.some((p) => p.user?._id === user?.id) &&
      user?.id;

    const getStatusText = (game) => {
      switch (game.status) {
        case "open":
          return game.players?.length === 0
            ? "New game - waiting for first player..."
            : "Waiting for opponent...";
        case "setup":
          return "Players are setting up...";
        case "active":
          return `Current Turn: ${game.currentTurn?.username || "Unknown"}`;
        case "completed":
          return `Winner: ${game.winner?.username || "N/A"}`;
        default:
          return "Unknown status";
      }
    };

    return (
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-blue-200">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-blue-900">
              {player1?.username || "Waiting..."} vs.{" "}
              {player2?.username || "Waiting..."}
            </h3>
            <p className="text-sm text-blue-700">
              Started: {formatDate(game.createdAt)}
            </p>
            {game.endedAt && (
              <p className="text-sm text-blue-700">
                Ended: {formatDate(game.endedAt)}
              </p>
            )}
            <p className="text-sm font-medium text-blue-800">
              Status: {getStatusText(game)}
            </p>
          </div>
          <div className="text-right">
            {showJoinButton ? (
              <button
                onClick={() => handleJoinGame(game._id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  canJoin
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!canJoin}
                title={
                  !canJoin
                    ? game.players?.some((p) => p.user?._id === user?.id)
                      ? "You are already in this game"
                      : game.status !== "open"
                      ? "This game is not open for joining"
                      : game.players?.length >= 2
                      ? "This game is full"
                      : "You must be logged in to join"
                    : "Join this game"
                }
              >
                {canJoin ? "Join Game" : "Cannot Join"}
              </button>
            ) : (
              <Link
                to={`/game/${game._id}`}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
              >
                View Game
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const GameSection = ({ title, games, showJoinButton = false }) => {
    if (games.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-900 border-b-2 border-blue-200 pb-2">
          {title}
        </h2>
        <div className="grid gap-4">
          {games.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              showJoinButton={showJoinButton}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-xl">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Battleship Games</h1>
          {isAuthenticated && (
            <div className="space-x-4">
              <button
                onClick={handleCreateGame}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                New Game
              </button>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <>
            <div className="space-y-8">
              <GameSection
                title="Games Available to Join"
                games={joinableGames}
                showJoinButton={true}
              />
              <GameSection title="My Open Games" games={myOpenGames} />
              <GameSection title="My Active Games" games={myActiveGames} />
              <GameSection
                title="My Completed Games"
                games={myCompletedGames}
              />
              <GameSection
                title="Other Games"
                games={otherGames}
                showJoinButton={true}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 p-4 bg-blue-100 rounded-lg border border-blue-200">
              <p className="text-center text-blue-800">
                Please{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  log in
                </Link>{" "}
                or{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  register
                </Link>{" "}
                to play Battleship!
              </p>
            </div>
            <div className="space-y-8">
              <GameSection title="Active Games" games={activeGames} />
              <GameSection title="Completed Games" games={completedGames} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Games;
