const Agent = require("../models/Agent");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get all agents
const getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status; // 'active', 'inactive'

    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.isActive = status === "active";
    }

    const [agents, totalAgents] = await Promise.all([
      Agent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Agent.countDocuments(query),
    ]);

    // Get referral statistics for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const referredUsers = await User.countDocuments({
          referral: agent.referralCode,
        });

        return {
          ...agent.toObject(),
          referredUsers,
        };
      })
    );

    res.json({
      success: true,
      data: {
        agents: agentsWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAgents / limit),
          totalAgents,
          hasNextPage: page < Math.ceil(totalAgents / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get agents error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching agents",
    });
  }
};

// Create new agent
const createAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { fullName, mobile, email, password } = req.body;

    // Check if mobile/email already exists
    const existingMobile = await Agent.findOne({
      $or: [{ mobile }, { email }],
    });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile or Email already exists",
      });
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingAgent = await Agent.findOne({ referralCode });
      if (!existingAgent) {
        isUnique = true;
      }
    }

    const agent = new Agent({
      fullName,
      mobile,
      email,
      password: password || "defaultpass123",
      referralCode, // Auto-generated unique code
    });

    await agent.save();

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: { agent },
    });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating agent",
    });
  }
};

// Update agent
const updateAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { agentId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdBy;
    delete updates.createdAt;

    // If updating referral code, check uniqueness
    if (updates.referralCode) {
      const existingAgent = await Agent.findOne({
        referralCode: updates.referralCode,
        _id: { $ne: agentId },
      });
      if (existingAgent) {
        return res.status(400).json({
          success: false,
          message: "Referral code already exists",
        });
      }
    }

    const agent = await Agent.findByIdAndUpdate(
      agentId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    res.json({
      success: true,
      message: "Agent updated successfully",
      data: { agent },
    });
  } catch (error) {
    console.error("Update agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating agent",
    });
  }
};

// Get agent details with statistics
const getAgentDetails = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Get referred users
    const referredUsers = await User.find({
      referral: agent.referralCode,
    })
      .select("username mobileNumber balance createdAt isActive")
      .sort({ createdAt: -1 });

    // Calculate agent statistics
    const totalReferrals = referredUsers.length;
    const activeReferrals = referredUsers.filter(
      (user) => user.isActive
    ).length;

    // Calculate total commission earned (this would need to be tracked separately)
    // For now, we'll calculate based on user activities
    const Bet = require("../models/Bet");
    const referredUserIds = referredUsers.map((user) => user._id);

    let stats = {
      totalBets: 0,
      totalAmount: 0,
      totalCommission: 0,
    };

    if (referredUserIds.length > 0) {
      const bettingStats = await Bet.aggregate([
        {
          $match: {
            userId: { $in: referredUserIds },
          },
        },
        {
          $group: {
            _id: null,
            totalBets: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalCommission: {
              $sum: {
                $multiply: ["$amount", (agent.commissionRate || 5) / 100],
              },
            },
          },
        },
      ]);

      stats = bettingStats[0] || stats;
    }

    res.json({
      success: true,
      data: {
        agent,
        referredUsers,
        statistics: {
          totalReferrals,
          activeReferrals,
          ...stats,
        },
      },
    });
  } catch (error) {
    console.error("Get agent details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching agent details",
    });
  }
};

// Toggle agent status
const toggleAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    agent.isActive = !agent.isActive;
    await agent.save();

    res.json({
      success: true,
      message: `Agent ${
        agent.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        agentId: agent._id,
        isActive: agent.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle agent status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating agent status",
    });
  }
};

// Delete agent
const deleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Get agent details first
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Check if agent has referred users
    const referredUsers = await User.countDocuments({
      referral: agent.referralCode,
    });

    if (referredUsers > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete agent with existing referrals",
      });
    }

    await Agent.findByIdAndDelete(agentId);

    res.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting agent",
    });
  }
};

// Generate referral code
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  getAllAgents,
  createAgent,
  updateAgent,
  getAgentDetails,
  toggleAgentStatus,
  deleteAgent,
  generateReferralCode,
};
