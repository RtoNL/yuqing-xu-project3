import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HighScores from "./pages/HighScores";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <div className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/highscores" element={<HighScores />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/games" element={<Games />} />
              <Route
                path="/game/:gameId"
                element={
                  <PrivateRoute>
                    <Game />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              {/* 404 page - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
