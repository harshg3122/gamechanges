const mongoose = require("mongoose");

const singleDigitSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: true,
      index: true,
    },
    number: {
      type: Number,
      required: true,
      min: 0,
      max: 9,
    },
    tokens: {
      type: Number,
      required: true,
      min: 0,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
singleDigitSchema.index({ roundId: 1, number: 1 }, { unique: true });
singleDigitSchema.index({ roundId: 1, locked: 1 });

module.exports = mongoose.model("SingleDigit", singleDigitSchema);
