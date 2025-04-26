import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
};

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user (password will be hashed by the pre-save hook)
    const user = await User.create({ username, password });

    // Generate token
    const token = generateToken(user._id);

    // Set session
    req.session.userId = user._id;

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set session
    req.session.userId = user._id;

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Logout user
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Check if user is logged in
router.get("/isLoggedIn", async (req, res) => {
  try {
    // First check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (user) {
          return res.json({
            isLoggedIn: true,
            user: {
              id: user._id,
              username: user.username,
              wins: user.wins,
              losses: user.losses,
            },
          });
        }
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    }

    // Fallback to session-based auth
    if (!req.session.userId) {
      return res.json({ isLoggedIn: false });
    }

    const user = await User.findById(req.session.userId).select("-password");
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
        res.clearCookie("connect.sid");
        return res.json({ isLoggedIn: false });
      });
    } else {
      res.json({
        isLoggedIn: true,
        user: {
          id: user._id,
          username: user.username,
          wins: user.wins,
          losses: user.losses,
        },
      });
    }
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).json({ message: "Error checking login status" });
  }
});

// Get all user scores for the leaderboard
router.get("/scores", async (req, res) => {
  try {
    console.log("🔍 Fetching user scores...");

    const users = await User.find({})
      .select("username wins losses")
      .sort({ wins: -1, losses: 1, username: 1 })
      .lean();

    console.log(`✅ Found ${users.length} users with scores`);

    // Transform the data to include win rate
    const scores = users.map((user) => ({
      username: user.username,
      wins: user.wins || 0,
      losses: user.losses || 0,
      totalGames: (user.wins || 0) + (user.losses || 0),
      winRate: (
        ((user.wins || 0) / ((user.wins || 0) + (user.losses || 0) || 1)) *
        100
      ).toFixed(1),
    }));

    res.json({
      success: true,
      scores,
    });
  } catch (error) {
    console.error("❌ Error fetching user scores:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching scores",
      error: error.message,
    });
  }
});

// Get user stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("username wins losses")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate win rate
    const totalGames = user.wins + user.losses;
    const winRate =
      totalGames > 0 ? ((user.wins / totalGames) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        totalGames,
        winRate: parseFloat(winRate),
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user stats",
    });
  }
});

export default router;
