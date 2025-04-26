import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import { attachUser } from "./middleware/auth.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import MongoStore from "connect-mongo";

dotenv.config();

// Set NODE_ENV
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS configuration
const productionOrigin =
  "https://yuqing-xu-yujing-cen-project3-okhg.onrender.com";
const developmentOrigin = "http://localhost:5173";

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? productionOrigin
        : developmentOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: true,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store:
      process.env.NODE_ENV === "production"
        ? new MongoStore({
            mongoUrl: process.env.MONGODB_URI,
            ttl: 24 * 60 * 60, // = 24 hours
            autoRemove: "native",
            touchAfter: 24 * 3600, // Only update the session every 24 hours unless the data changes
          })
        : undefined,
  })
);

// Add this before your routes
app.use((req, res, next) => {
  console.log("Session Debug:", {
    id: req.sessionID,
    userId: req.session?.userId,
    cookie: req.session?.cookie,
  });
  next();
});

app.use(attachUser);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);

// Serve static files from frontend dist folder
app.use(express.static(join(__dirname, "../dist")));

// All non-API routes return frontend index.html
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../dist", "index.html"));
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/battleship")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
