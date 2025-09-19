/**
 * Auto Result Service - Production ready automatic result declaration
 * Handles automatic result generation when admin doesn't declare results
 */

const mongoose = require("mongoose");
const Round = require("../models/Round");
const Result = require("../models/Result");
const resultService = require("../services/resultService");

let jobRunning = false;

/**
 * Process rounds that need auto result declaration
 */
async function processAutoResultDeclaration() {
  if (jobRunning) {
    console.log("⏳ Auto result job already running, skipping...");
    return;
  }

  jobRunning = true;

  try {
    console.log("🎯 Processing auto result declaration...");

    // Find active rounds that might need auto-declaration
    const activeRounds = await Round.find({
      status: "active",
    }).sort({ createdAt: -1 });

    for (const round of activeRounds) {
      try {
        // Check if result already exists
        const existingResult = await Result.findOne({ roundId: round._id });
        if (existingResult) {
          console.log(`Result already exists for round ${round._id}, skipping`);
          continue;
        }

        // Validate timing for this round
        const timingValidation =
          resultService.validateResultDeclarationTiming(round);

        // If it's time for system to declare result
        if (timingValidation.isSystemPeriod || timingValidation.roundEnded) {
          console.log(
            `Auto-declaring result for round ${round._id} (${round.timeSlot})`
          );

          // Initialize numbers if not already done
          await resultService.initializeRoundNumbers(round._id);

          // Auto-generate result
          const autoResult = await resultService.autoGenerateResult(round._id);

          if (autoResult.success) {
            console.log(
              `✅ Auto-declared result for round ${round._id}: ${autoResult.result.tripleDigitNumber} -> ${autoResult.result.singleDigitResult}`
            );
          } else {
            console.error(
              `❌ Failed to auto-declare result for round ${round._id}: ${autoResult.message}`
            );
          }
        } else if (timingValidation.isAdminPeriod) {
          console.log(
            `Round ${round._id} is in admin declaration period (${timingValidation.minutesToEnd} minutes remaining)`
          );
        } else {
          // Round is not yet in declaration period
          console.log(
            `Round ${round._id} not yet in declaration period (${timingValidation.minutesToEnd} minutes remaining)`
          );
        }
      } catch (error) {
        console.error(`Error processing round ${round._id}:`, error);
      }
    }

    console.log("🎯 Auto result declaration processing completed");
  } catch (error) {
    console.error("❌ Error in auto result declaration:", error);
  } finally {
    jobRunning = false;
  }
}

/**
 * Start the auto result declaration job
 */
function startAutoResultJob() {
  console.log("🚀 Starting Auto Result Declaration Service...");

  // Run immediately after a short delay
  setTimeout(() => {
    processAutoResultDeclaration();
  }, 10000); // 10 seconds delay

  // Then run every 1 minute
  setInterval(() => {
    processAutoResultDeclaration();
  }, 60 * 1000); // Every 1 minute

  console.log(
    "✅ Auto Result Declaration Service started - checking every 1 minute"
  );
}

/**
 * Initialize round numbers for all active rounds (startup task)
 */
async function initializeActiveRounds() {
  try {
    console.log("🔄 Initializing numbers for active rounds...");

    const activeRounds = await Round.find({ status: "active" });

    for (const round of activeRounds) {
      try {
        await resultService.initializeRoundNumbers(round._id);
        console.log(`✅ Initialized numbers for round ${round._id}`);
      } catch (error) {
        console.error(`❌ Error initializing round ${round._id}:`, error);
      }
    }

    console.log(
      `✅ Initialized numbers for ${activeRounds.length} active rounds`
    );
  } catch (error) {
    console.error("❌ Error initializing active rounds:", error);
  }
}

module.exports = {
  startAutoResultJob,
  processAutoResultDeclaration,
  initializeActiveRounds,
};
