import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "../config/axios";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    totalGames: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/users/stats");
        if (response.data.success) {
          setStats(response.data.stats);
        } else {
          toast.error("Failed to fetch stats");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Error loading profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-gray-600">Username:</div>
            <div>{user?.username}</div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Game Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-600">Total Games</div>
              <div className="text-2xl font-bold">{stats.totalGames}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-600">Games Won</div>
              <div className="text-2xl font-bold">{stats.wins}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-600">Games Lost</div>
              <div className="text-2xl font-bold">{stats.losses}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-gray-600">Win Rate</div>
              <div className="text-2xl font-bold">{stats.winRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
