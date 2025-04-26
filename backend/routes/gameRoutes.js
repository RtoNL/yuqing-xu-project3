import express from "express";
import Game from "../models/game.js";
import User from "../models/user.js";
import { isValidPlacement, placeShip } from "../utils/gameUtils.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get joinable games
router.get("/joinable", requireAuth, async (req, res) => {
  try {
    console.log("🔍 Fetching joinable games for user:", req.user.username);

    // First, let's verify the query works
    const games = await Game.find({
      status: "open",
      "players.1": { $exists: false },
      "players.0.user": { $ne: req.user._id },
    }).populate("players.user", "username");

    console.log("📊 Query result:", {
      totalGames: games.length,
      firstGame: games[0]
        ? {
            id: games[0]._id,
            status: games[0].status,
            players: games[0].players.map((p) => ({
              userId: p.user._id,
              username: p.user.username,
            })),
          }
        : null,
    });

    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error("❌ Error fetching joinable games:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching joinable games",
      error: error.message,
    });
  }
});

// Get all games
router.get("/", async (req, res) => {
  try {
    const games = await Game.find()
      .populate("players.user", "username")
      .populate("currentTurn", "username")
      .populate("winner", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching games",
      error: error.message,
    });
  }
});

// Create a new game
router.post("/create", requireAuth, async (req, res) => {
  try {
    const game = new Game({
      players: [{ user: req.user._id }],
      status: "open",
    });

    await game.save();
    await game.populate("players.user", "username");

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create game: " + error.message,
    });
  }
});

// Get a specific game
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("players.user", "username")
      .populate("currentTurn", "username")
      .populate("winner", "username");

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Check if user is a participant
    const isParticipant = game.players.some(
      (p) => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this game",
      });
    }

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching game",
      error: error.message,
    });
  }
});

// Join a game
router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (game.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Game is not open for joining",
      });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "Game is full",
      });
    }

    if (
      game.players.some((p) => p.user.toString() === req.user._id.toString())
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already in this game",
      });
    }

    // Add the second player
    game.players.push({
      user: req.user._id,
      board: Array(10)
        .fill()
        .map(() => Array(10).fill("")),
      ships: [],
      moves: Array(10)
        .fill()
        .map(() => Array(10).fill(false)),
      ready: false,
    });

    // Update game status to setup when second player joins
    if (game.players.length === 2) {
      game.status = "setup";
    }

    await game.save();
    await game.populate("players.user", "username");

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("Error joining game:", error);
    res.status(500).json({
      success: false,
      message: "Error joining game",
      error: error.message,
    });
  }
});

// Place ships
router.post("/:id/place-ships", requireAuth, async (req, res) => {
  try {
    const { ships } = req.body;
    const userId = req.user._id;

    // Validate ships array
    if (!Array.isArray(ships) || ships.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "Invalid number of ships. Must be exactly 5 ships.",
      });
    }

    // Find the game
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Verify user is a participant
    const playerIndex = game.players.findIndex((p) => p.user.equals(userId));
    if (playerIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this game",
      });
    }

    // Verify game is in setup status
    if (game.status !== "setup") {
      return res.status(400).json({
        success: false,
        message: "Ships can only be placed during setup phase",
      });
    }

    // Create a new board from the ships
    const board = Array(10)
      .fill(null)
      .map(() => Array(10).fill(""));

    // Place each ship on the board
    for (const ship of ships) {
      const { row, col, size, isHorizontal } = ship;

      // Validate ship position
      if (
        row < 0 ||
        row >= 10 ||
        col < 0 ||
        col >= 10 ||
        (isHorizontal && col + size > 10) ||
        (!isHorizontal && row + size > 10)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid ship position. Ship would be out of bounds.",
        });
      }

      // Check for overlapping ships
      for (let i = 0; i < size; i++) {
        const r = row + (isHorizontal ? 0 : i);
        const c = col + (isHorizontal ? i : 0);
        if (board[r][c] === "S") {
          return res.status(400).json({
            success: false,
            message: "Ships cannot overlap.",
          });
        }
        board[r][c] = "S";
      }
    }

    // Update the player's board and ready status
    game.players[playerIndex].board = board;
    game.players[playerIndex].ready = true;

    // If both players are ready, start the game
    if (game.players.every((p) => p.ready)) {
      game.status = "active";
      // Randomly select who goes first
      game.currentTurn = game.players[Math.random() < 0.5 ? 0 : 1].user;
    }

    await game.save();

    // Return the updated game
    const populatedGame = await Game.findById(game._id)
      .populate("players.user", "username")
      .populate("currentTurn", "username")
      .populate("winner", "username");

    res.json({
      success: true,
      game: populatedGame,
      message:
        game.status === "active"
          ? "Game started!"
          : "Ships placed successfully!",
    });
  } catch (error) {
    console.error("Error placing ships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place ships. Please try again.",
    });
  }
});

// Make a move
router.post("/:id/move", requireAuth, async (req, res) => {
  try {
    const { row, col } = req.body;

    // Validate move coordinates
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid move coordinates",
      });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (game.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Game is not active",
      });
    }

    if (game.currentTurn.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Not your turn",
      });
    }

    // Process player move
    const playerIndex = game.players.findIndex((p) =>
      p.user.equals(req.user._id)
    );
    const opponentIndex = playerIndex === 0 ? 1 : 0;
    const moves = game.players[playerIndex].moves;
    const targetBoard = game.players[opponentIndex].board;

    // Check if move has already been made
    if (moves[row][col]) {
      return res.status(400).json({
        success: false,
        message: "Move already made at this position",
      });
    }

    // Record the move
    moves[row][col] = true;

    // Check if it's a hit
    const isHit = targetBoard[row][col] === "S";

    // Check for game over - only if this move was a hit
    let gameOver = false;
    if (isHit) {
      gameOver = true;
      // Only check for game over if we hit a ship
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if (targetBoard[i][j] === "S" && !moves[i][j]) {
            gameOver = false;
            break;
          }
        }
        if (!gameOver) break;
      }
    }

    if (gameOver) {
      game.status = "completed";
      game.winner = req.user._id;
      game.endTime = new Date();

      // Update player statistics
      const winner = await User.findById(req.user._id);
      const loserId = game.players[opponentIndex].user;
      const loser = await User.findById(loserId);

      winner.wins += 1;
      loser.losses += 1;

      await winner.save();
      await loser.save();
    } else {
      // Switch turns
      game.currentTurn = game.players[opponentIndex].user;
    }

    // Save the game state
    await game.save();

    // Populate game data before sending response
    await game.populate(["players.user", "winner", "currentTurn"]);

    res.json({
      success: true,
      game: game.toObject(),
      hit: isHit,
      gameOver: game.status === "completed",
    });
  } catch (error) {
    console.error("Error making move:", error);
    res.status(500).json({
      success: false,
      message: "Error making move: " + error.message,
    });
  }
});

export default router;
