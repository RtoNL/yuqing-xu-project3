import User from "../models/user.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to check if user is authenticated
export const requireAuth = async (req, res, next) => {
  try {
    console.log("🔐 Checking auth, session:", req.session);

    if (!req.session?.userId) {
      console.log("❌ No userId in session");
      return res.status(401).json({
        success: false,
        message: "Please log in to continue",
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log("❌ User not found in database:", req.session.userId);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ Auth successful for user:", user.username);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

// Middleware to attach user if logged in (but not require auth)
export const attachUser = async (req, res, next) => {
  try {
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Error attaching user:", error);
    next();
  }
};
