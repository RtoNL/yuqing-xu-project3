import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import bcryptjs from "bcryptjs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;

    // Save session before sending response
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
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
    console.log(`🔐 Login attempt for user: ${username}`);

    const user = await User.findOne({ username });

    if (!user) {
      console.log(`❌ Login failed: User ${username} not found`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Login failed: Invalid password for user ${username}`);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Set session data
    req.session.userId = user._id;
    req.session.username = user.username;

    console.log(`✅ Setting session for user ${username}:`, {
      sessionID: req.sessionID,
      userId: req.session.userId,
      username: req.session.username,
    });

    // Save session before sending response
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error(`❌ Error saving session: ${err.message}`);
          reject(err);
        }
        console.log(`✅ Session saved successfully for ${username}`);
        resolve();
      });
    });

    // Send response after session is saved
    console.log(`✅ Login successful for user ${username}, sending response`);
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
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
    console.log("🔍 Checking if user is logged in:", {
      sessionID: req.sessionID,
      sessionData: req.session,
      cookies: req.cookies,
    });

    if (!req.session?.userId) {
      console.log("❌ No userId in session, user is not logged in");
      return res.json({ isLoggedIn: false });
    }

    const user = await User.findById(req.session.userId).select("-password");
    if (!user) {
      console.log(`❌ User ${req.session.userId} not found in database`);
      req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
        res.clearCookie("connect.sid");
        return res.json({ isLoggedIn: false });
      });
    } else {
      console.log(`✅ User ${user.username} is logged in`);
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
