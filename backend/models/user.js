import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create default user static method
userSchema.statics.createDefaultUser = async function () {
  try {
    const defaultUser = await this.findOne({ username: "DefaultUser" });
    if (!defaultUser) {
      return await this.create({
        username: "DefaultUser",
        password: "default123456",
      });
    }
    return defaultUser;
  } catch (error) {
    console.error("Error creating default user:", error);
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
