const mongoose = require("mongoose");

const {
  MONGODB_URI = "mongodb://localhost:27017/game999",
  DB_RETRY_ATTEMPTS = 5,
  DB_RETRY_DELAY = 5000,
} = process.env;

if (!MONGODB_URI) {
  console.warn("⚠️  MONGODB_URI not set in environment variables!");
}

let connectionAttempts = 0;
const maxAttempts = parseInt(DB_RETRY_ATTEMPTS, 10);
const retryDelay = parseInt(DB_RETRY_DELAY, 10);

// Connection options
const options = {
  // Remove deprecated options
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};

// Connect to MongoDB with retry logic
async function connectDB() {
  try {
    connectionAttempts++;
    console.log(
      `🔌 Attempting to connect to MongoDB (attempt ${connectionAttempts}/${maxAttempts})...`
    );

    await mongoose.connect(MONGODB_URI, options);
    console.log("✅ MongoDB connected successfully");

    // Reset connection attempts on success
    connectionAttempts = 0;

    return true;
  } catch (err) {
    console.error(
      `❌ MongoDB connection failed (attempt ${connectionAttempts}):`,
      err.message
    );

    if (connectionAttempts < maxAttempts) {
      console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
      setTimeout(connectDB, retryDelay);
    } else {
      console.error(
        "💥 Max connection attempts reached. Database unavailable."
      );
      // Don't exit process - allow app to continue with queue-based fallback
    }

    return false;
  }
}

// Connection event handlers
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 Mongoose disconnected from MongoDB");

  // Attempt to reconnect
  if (connectionAttempts === 0) {
    console.log("🔄 Attempting to reconnect...");
    connectDB();
  }
});

mongoose.connection.on("reconnected", () => {
  console.log("🟢 Mongoose reconnected to MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error during graceful shutdown:", err);
    process.exit(1);
  }
});

// Health check function
function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

// Get connection stats
function getConnectionStats() {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[state] || "unknown",
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
}

module.exports = {
  connectDB,
  isDBConnected,
  getConnectionStats,
};
