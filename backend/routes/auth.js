import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();

    // Set session
    req.session.userId = user._id;
    await req.session.save();

    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user._id;
    await req.session.save();

    console.log("Login successful, session:", req.session);

    res.json({
      message: "Logged in successfully",
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error logging out", error: err.message });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Check if user is logged in
router.get("/isLoggedIn", async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        return res.json({
          isLoggedIn: true,
          user: { id: user._id, username: user.username },
        });
      }
    }
    res.json({ isLoggedIn: false });
  } catch (error) {
    console.error("IsLoggedIn error:", error);
    res
      .status(500)
      .json({ message: "Error checking login status", error: error.message });
  }
});

export default router;
