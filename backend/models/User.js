const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      // Relax validation to any 10-digit number for flexibility across regions
      match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"],
      default: undefined,
    },
    email: {
      type: String,
      required: false,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      trim: true,
      lowercase: true,
    },
    referral: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    wallet: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },
    walletBalance: {
      type: Number,
      default: function () {
        return this.wallet || 0;
      },
      min: [0, "Wallet balance cannot be negative"],
    },
    selectedNumbers: {
      classA: {
        number: String,
        amount: { type: Number, default: 0 },
        placedAt: Date,
        roundId: String,
      },
      classB: {
        number: String,
        amount: { type: Number, default: 0 },
        placedAt: Date,
        roundId: String,
      },
      classC: {
        number: String,
        amount: { type: Number, default: 0 },
        placedAt: Date,
        roundId: String,
      },
    },
    role: {
      type: String,
      default: "user",
      enum: ["user"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    totalWinnings: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true }); // sparse: true for optional fields
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Virtual for user's win/loss ratio
userSchema.virtual("winLossRatio").get(function () {
  if (this.totalLosses === 0) return this.totalWinnings > 0 ? "Perfect" : "N/A";
  return (this.totalWinnings / this.totalLosses).toFixed(2);
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("passwordHash")) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    } catch (error) {
      return next(error);
    }
  }

  // Sync wallet and walletBalance
  if (this.isModified("wallet")) {
    this.walletBalance = this.wallet;
  } else if (this.isModified("walletBalance")) {
    this.wallet = this.walletBalance;
  }

  next();
});

// Instance method to check password
userSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find user by email, mobile or username
userSchema.statics.findByCredentials = async function (identifier, password) {
  console.log(
    "🔍 [findByCredentials] Looking for user with identifier:",
    identifier
  );

  const user = await this.findOne({
    $or: [
      { mobileNumber: identifier },
      { username: identifier },
      { email: identifier },
    ],
    isActive: true,
  });

  console.log("🔍 [findByCredentials] User found:", !!user);
  if (user) {
    console.log("🔍 [findByCredentials] User details:", {
      id: user._id,
      username: user.username,
      mobile: user.mobileNumber,
      email: user.email,
      isActive: user.isActive,
    });
  }

  if (!user) {
    console.log("❌ [findByCredentials] No user found");
    throw new Error("Invalid credentials");
  }

  console.log("🔍 [findByCredentials] Checking password...");
  const isMatch = await user.checkPassword(password);
  console.log("🔍 [findByCredentials] Password match result:", isMatch);

  if (!isMatch) {
    console.log("❌ [findByCredentials] Password mismatch");
    throw new Error("Invalid credentials");
  }

  console.log("✅ [findByCredentials] Login successful");
  return user;
};

// Transform toJSON to remove sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
