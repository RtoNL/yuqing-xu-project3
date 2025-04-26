import React, { useState, useEffect } from "react";
import axios from "../config/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/HighScores.css";

const HighScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchHighScores = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/users/scores");

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch scores");
        }

        // Sort the scores
        const sortedScores = response.data.scores.sort((a, b) => {
          // 1. Sort by win rate descending
          if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
            return parseFloat(b.winRate) - parseFloat(a.winRate);
          }
          // 2. If win rates are equal, sort by total games descending
          if (b.totalGames !== a.totalGames) {
            return b.totalGames - a.totalGames;
          }
          // 3. If total games are equal, sort by username alphabetically ascending
          return a.username.localeCompare(b.username);
        });

        setScores(sortedScores);
      } catch (err) {
        console.error("Error fetching high scores:", err);
        setError("Failed to load high scores. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHighScores();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading high scores...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="highscores-container p-4 md:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        High Scores
      </h1>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Rank
              </th>
              <th scope="col" className="px-6 py-3">
                Player Name
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Total Games
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Wins
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Losses
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr className="bg-white border-b">
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-gray-500 italic"
                >
                  No scores recorded yet.
                </td>
              </tr>
            ) : (
              scores.map((score, index) => {
                const isCurrentUser = user && score.username === user.username;
                return (
                  <tr
                    key={score.username}
                    className={`bg-white border-b ${
                      isCurrentUser
                        ? "bg-blue-100 font-bold text-blue-800"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">{index + 1}</td>
                    <td scope="row" className="px-6 py-4 whitespace-nowrap">
                      {score.username}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {score.totalGames}
                    </td>
                    <td className="px-6 py-4 text-center">{score.wins}</td>
                    <td className="px-6 py-4 text-center">{score.losses}</td>
                    <td className="px-6 py-4 text-center">{score.winRate}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Optional: Add back info box if needed */}
      {/* <div className="info-box mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
        <p>Scores are updated after each completed game.</p>
      </div> */}
    </div>
  );
};

export default HighScores;
