import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        board: {
          type: [[String]],
          default: () =>
            Array(10)
              .fill()
              .map(() => Array(10).fill("")),
        },
        ships: [
          {
            type: {
              type: String,
              required: true,
            },
            positions: [
              {
                row: Number,
                col: Number,
              },
            ],
          },
        ],
        moves: {
          type: [[Boolean]],
          default: () =>
            Array(10)
              .fill()
              .map(() => Array(10).fill(false)),
        },
        ready: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ["open", "setup", "active", "completed"],
      default: "open",
    },
    currentTurn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isAI: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if game is joinable
gameSchema.virtual("isJoinable").get(function () {
  return this.status === "open" && this.players.length < 2;
});

// Method to check if a user is a participant
gameSchema.methods.isParticipant = function (userId) {
  return this.players.some((player) => player.user.equals(userId));
};

// Method to join a game
gameSchema.methods.join = async function (userId) {
  if (!this.isJoinable) {
    throw new Error("Game is not joinable");
  }

  if (this.isParticipant(userId)) {
    throw new Error("User is already a participant");
  }

  this.players.push({
    user: userId,
    board: Array(10)
      .fill()
      .map(() => Array(10).fill("")),
    ships: [],
    moves: Array(10)
      .fill()
      .map(() => Array(10).fill(false)),
    ready: false,
  });

  if (this.players.length === 2) {
    this.status = "active";
    // Randomly select who goes first
    this.currentTurn = this.players[Math.random() < 0.5 ? 0 : 1].user;
  }

  await this.save();
  return this;
};

// Method to make a move
gameSchema.methods.makeMove = async function (userId, x, y) {
  if (this.status !== "active") {
    throw new Error("Game is not active");
  }

  if (!this.currentTurn.equals(userId)) {
    throw new Error("Not your turn");
  }

  const isPlayer1 = this.players.some((player) => player.user.equals(userId));
  const moves = isPlayer1 ? this.players[1].moves : this.players[0].moves;
  const targetBoard = isPlayer1 ? this.players[0].board : this.players[1].board;

  if (moves[x][y]) {
    throw new Error("Move already made at this position");
  }

  moves[x][y] = true;
  const hit = targetBoard[x][y] !== "";

  // Switch turns
  this.currentTurn = isPlayer1 ? this.players[0].user : this.players[1].user;

  // Check for winner
  const hasWon = this.checkForWin(moves, targetBoard);
  if (hasWon) {
    this.status = "completed";
    this.winner = userId;
    this.endTime = new Date();
  }

  await this.save();
  return { hit, hasWon };
};

// Helper method to check for win
gameSchema.methods.checkForWin = function (moves, targetBoard) {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (targetBoard[i][j] !== "" && !moves[i][j]) {
        return false;
      }
    }
  }
  return true;
};

const Game = mongoose.model("Game", gameSchema);

export default Game;
