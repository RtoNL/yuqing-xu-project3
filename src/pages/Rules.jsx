import React from "react";

const Rules = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Battleship Rules
        </h1>
        <p className="text-lg text-gray-600">
          Master the seas, sink your opponent's fleet! 🚢
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Game Overview
          </h2>
          <p className="text-gray-600">
            Battleship is a thrilling two-player naval combat game where you'll
            engage in strategic warfare to locate and sink your opponent's fleet
            before they sink yours! 🎯
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Ship Fleet</h2>
          <p className="text-gray-600">
            Each player commands a fleet of 5 powerful ships:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-center space-x-3 text-gray-600">
              <span className="text-2xl">🚢</span>
              <span>Aircraft Carrier - 5 spaces</span>
            </li>
            <li className="flex items-center space-x-3 text-gray-600">
              <span className="text-2xl">🚢</span>
              <span>Battleship - 4 spaces</span>
            </li>
            <li className="flex items-center space-x-3 text-gray-600">
              <span className="text-2xl">🚢</span>
              <span>Cruiser - 3 spaces</span>
            </li>
            <li className="flex items-center space-x-3 text-gray-600">
              <span className="text-2xl">🚢</span>
              <span>Submarine - 3 spaces</span>
            </li>
            <li className="flex items-center space-x-3 text-gray-600">
              <span className="text-2xl">🚢</span>
              <span>Destroyer - 2 spaces</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Gameplay</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Taking Turns:</span> Players
              alternate firing at their opponent's grid
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Hit:</span> When you strike an enemy
              ship 💥
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Miss:</span> When you hit empty
              water 💦
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Your Ships:</span> Visible on your
              grid with 🚢
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Game Status</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Open:</span> Waiting for an opponent
              to join
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Active:</span> Battle in progress!
              ⚔️
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Completed:</span> Victory achieved!
              🏆
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">How to Win</h2>
          <p className="text-gray-600">
            Be the first to sink all of your opponent's ships! Your victories
            will be recorded on the High Scores page 🏅
          </p>
        </section>
      </div>
    </div>
  );
};

export default Rules;
