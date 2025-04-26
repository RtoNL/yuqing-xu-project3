import React from "react";
import { Link, useNavigate } from "react-router-dom";
import battleshipLogo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import axios from "../config/axios";
import { toast } from "react-hot-toast";
// import "../styles/home.css";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCreateGame = async () => {
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8 transform hover:scale-105 transition duration-300">
          <img
            src={battleshipLogo}
            alt="Battleship Logo"
            className="w-48 h-auto mx-auto"
          />
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Battleship! 🚢
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Command your fleet, strategize your attacks, and become the ultimate
          naval commander in this classic battle of wits and tactics! ⚔️
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {isAuthenticated ? (
            <>
              <Link
                to="/games"
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-200"
              >
                <span>View Games</span>
                <span className="text-xl">🎮</span>
              </Link>
              <button
                onClick={handleCreateGame}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-200"
              >
                <span>Start New Game</span>
                <span className="text-xl">⚔️</span>
              </button>
              <Link
                to="/rules"
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-200"
              >
                <span>View Rules</span>
                <span className="text-xl">📖</span>
              </Link>
              <Link
                to="/scores"
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-200"
              >
                <span>High Scores</span>
                <span className="text-xl">🏆</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="col-span-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-200"
            >
              <span>Login to Play</span>
              <span className="text-xl">🎮</span>
            </Link>
          )}
        </div>

        <div className="mt-12 text-gray-600">
          <p className="text-lg">
            Ready to prove your tactical prowess? Join the battle now! 🌊
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
