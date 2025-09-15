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
      // Check if admin exists
      const existingAdmin = await Admin.findOne({ username: "admin" });
      if (existingAdmin) {
        console.log("✅ Admin already exists");
        console.log("Username:", existingAdmin.username);
        console.log("Email:", existingAdmin.email);
        console.log("Full Name:", existingAdmin.fullName);
      } else {
        // Create admin
        const hashedPassword = await bcrypt.hash("admin123", 12);
        const admin = new Admin({
          username: "admin",
          email: "admin@game.com",
          passwordHash: hashedPassword,
          fullName: "System Administrator",
          role: "admin",
        });

        await admin.save();
        console.log("✅ Admin created successfully!");
        console.log("Username: admin");
        console.log("Password: admin123");
        console.log("Email: admin@game.com");
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }

    mongoose.disconnect();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });
