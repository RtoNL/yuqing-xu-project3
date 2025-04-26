import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Rules from "./pages/Rules";
import Game from "./pages/Game";
import HighScores from "./pages/HighScores";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GamesList from "./pages/GamesList";
import { useAuth } from "./context/AuthContext";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Auth Route component (redirects to home if already logged in)
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/highscores" element={<HighScores />} />

      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />

      {/* Game routes */}
      <Route
        path="/games"
        element={
          <ProtectedRoute>
            <GamesList />
          </ProtectedRoute>
        }
      />
      <Route path="/game/:id" element={<Game />} />
    </Routes>
  );
};

export default AppRoutes;
