const mongoose = require("mongoose");

async function testConnection() {
  try {
    console.log("🔄 Testing MongoDB connection...");

    const mongoURI = "mongodb://localhost:27017/numbergame";
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully!");

    // Test if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(
      "📊 Available collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();
    console.log("✅ Connection test completed successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
