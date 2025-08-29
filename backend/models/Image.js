const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId, // Admin ka _id
    ref: "Admin", // Admin model ka reference
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Image", imageSchema);
