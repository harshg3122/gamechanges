// MINIMAL WORKING SERVER
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const JWT_SECRET = "simple-secret-key";

console.log("🚀 Starting SIMPLE Server on port", PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body || "");
  next();
});

// Health check
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  res.json({
    message: "Simple Game 999 Server",
    status: "running",
    endpoints: ["GET /health", "POST /api/admin-panel/login"],
  });
});

// ADMIN LOGIN - HARDCODED FOR TESTING
app.post("/api/admin-panel/login", (req, res) => {
  console.log("🔐 Admin login attempt:", req.body);

  const { username, password } = req.body;

  // Simple hardcoded check
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign(
      { id: "admin123", role: "admin", username: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("✅ LOGIN SUCCESS - Token generated");

    return res.json({
      success: true,
      token: token,
      user: {
        id: "admin123",
        username: "admin",
        role: "admin",
      },
    });
  }

  console.log("❌ LOGIN FAILED - Invalid credentials");
  return res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });
});

// Simple auth middleware
function auth() {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "No token" });
    }

    const token = header.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
  };
}

// Protected route test
app.get("/api/admin-panel/test", auth(), (req, res) => {
  console.log("Protected route accessed by:", req.user.username);
  res.json({
    success: true,
    message: "Protected route works!",
    user: req.user,
  });
});

// Dummy routes for frontend compatibility
app.get("/api/admin-panel/agents", auth(), (req, res) => {
  res.json({ success: true, data: [] });
});

app.get("/api/admin-panel/users", auth(), (req, res) => {
  res.json({ success: true, data: [] });
});

app.get("/api/results/tables", (req, res) => {
  res.json({
    success: true,
    data: {
      singleDigitTable: [],
      tripleDigitTable: [],
      statistics: {},
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: "Server error" });
});

// 404 handler
app.use("*", (req, res) => {
  console.log("404:", req.method, req.originalUrl);
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log("✅ SIMPLE Server running successfully!");
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔐 Login: admin / admin123`);
  console.log("📋 Test with: curl http://localhost:5000/health");
  console.log("🎯 Ready for frontend connection!");
});
