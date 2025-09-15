const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Basic server is running" });
});

// Test agents endpoint
app.get("/api/admin-panel/agents", (req, res) => {
  console.log("📥 GET /api/admin-panel/agents");
  res.json({
    success: true,
    data: {
      agents: [
        {
          _id: "1",
          fullName: "Test Agent",
          mobile: "1234567890",
          referralCode: "TEST123",
        },
      ],
      pagination: {
        totalAgents: 1,
        currentPage: 1,
        totalPages: 1,
      },
    },
  });
});

// Test update endpoint
app.put("/api/admin-panel/agents/:id", (req, res) => {
  const { id } = req.params;
  const { fullName, mobile } = req.body;
  console.log("📥 PUT /api/admin-panel/agents/:id", { id, fullName, mobile });

  res.json({
    success: true,
    message: "Agent updated successfully",
    data: { agent: { _id: id, fullName, mobile } },
  });
});

// Test delete endpoint
app.delete("/api/admin-panel/agents/:id", (req, res) => {
  const { id } = req.params;
  console.log("📥 DELETE /api/admin-panel/agents/:id", { id });

  res.json({
    success: true,
    message: "Agent deleted successfully",
  });
});

// Test change password endpoint
app.post("/api/admin-panel/agents/:id/change-password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  console.log("📥 POST /api/admin-panel/agents/:id/change-password", {
    id,
    newPassword,
  });

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Basic Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Agents API: http://localhost:${PORT}/api/admin-panel/agents`);
});

module.exports = app;
