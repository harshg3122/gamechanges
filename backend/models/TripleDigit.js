const mongoose = require("mongoose");

const tripleDigitSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: true,
      index: true,
    },
    number: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{3}$/.test(v);
        },
        message: "Number must be exactly 3 digits",
      },
    },
    tokens: {
      type: Number,
      required: true,
      min: 0,
    },
    sumDigits: {
      type: Number,
      required: true,
      min: 0,
      max: 27, // Maximum sum of three digits (9+9+9)
    },
    lastDigit: {
      type: Number,
      required: true,
      min: 0,
      max: 9,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    classType: {
      type: String,
      default: "A",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
tripleDigitSchema.index({ roundId: 1, number: 1 }, { unique: true });
tripleDigitSchema.index({ roundId: 1, locked: 1 });
tripleDigitSchema.index({ roundId: 1, tokens: -1 }); // For sorting by tokens descending

module.exports = mongoose.model("TripleDigit", tripleDigitSchema);
