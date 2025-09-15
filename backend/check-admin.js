const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/numbergame", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Admin Schema
    const adminSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true },
      fullName: { type: String, required: true },
      role: { type: String, default: "admin" },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
    });

    const Admin = mongoose.model("Admin", adminSchema);

    try {
      // Get all admins
      const admins = await Admin.find({});
      console.log("📋 All admins in database:", admins.length);

      for (let admin of admins) {
        console.log("\n--- Admin ---");
        console.log("ID:", admin._id);
        console.log("Username:", admin.username);
        console.log("Email:", admin.email);
        console.log("Full Name:", admin.fullName);
        console.log("Role:", admin.role);
        console.log("Is Active:", admin.isActive);
        console.log(
          "Password Hash:",
          admin.passwordHash.substring(0, 20) + "..."
        );

        // Test password
        const testPassword = "admin123";
        const isMatch = await bcrypt.compare(testPassword, admin.passwordHash);
        console.log(`Password "${testPassword}" matches:`, isMatch);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }

    mongoose.disconnect();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
