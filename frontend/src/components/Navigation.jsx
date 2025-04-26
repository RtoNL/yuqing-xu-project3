import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../config/axios";
import { toast } from "react-hot-toast";

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/");
    }
  };

  const handleCreateGame = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post("/games/create");
      const { success, game } = response.data;

      if (!success || !game || !game._id) {
        throw new Error("Invalid game data received");
      }

      navigate(`/game/${game._id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game. Please try again.");
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-2 font-bold text-xl hover:text-blue-200 transition duration-150"
            >
              <span className="text-2xl">🚢</span>
              <span className="font-game">Battleship</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-grow justify-center items-baseline space-x-6">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:text-white transition duration-150"
            >
              Home
            </Link>
            <Link
              to="/rules"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:text-white transition duration-150"
            >
              Rules
            </Link>
            <Link
              to="/highscores"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:text-white transition duration-150"
            >
              High Scores
            </Link>
            <Link
              to="/games"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 hover:text-white transition duration-150"
            >
              Games
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleCreateGame}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center space-x-2"
            >
              <span>New Game</span>
              <span className="text-lg">⚔️</span>
            </button>
            {isAuthenticated ? (
              <>
                <span className="text-sm bg-blue-700 px-3 py-2 rounded-md">
                  Welcome, {user.username} 👋
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
