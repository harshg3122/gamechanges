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
      // Update the admin user with username 'admin' to have password 'admin123'
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const result = await Admin.updateOne(
        { username: "admin" },
        {
          $set: {
            passwordHash: hashedPassword,
            email: "admin@game.com",
            fullName: "System Administrator",
          },
        },
        { upsert: true }
      );

      if (result.modifiedCount > 0) {
        console.log("✅ Admin password updated successfully!");
      } else if (result.upsertedCount > 0) {
        console.log("✅ Admin created successfully!");
      } else {
        console.log("ℹ️ Admin already exists with correct data");
      }

      console.log("Username: admin");
      console.log("Password: admin123");

      // Test the password
      const admin = await Admin.findOne({ username: "admin" });
      const isMatch = await bcrypt.compare("admin123", admin.passwordHash);
      console.log("Password test result:", isMatch);
    } catch (error) {
      console.error("❌ Error:", error);
    }

    mongoose.disconnect();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
