// Time-based Gaming System: 10:00 AM - 3:00 AM Daily Schedule
// 17 hourly rounds, 50-minute betting windows + 10-minute admin periods

const moment = require("moment-timezone");

// Define all 17 time slots from 10 AM to 3 AM
const TIME_SLOTS = [
  { slot: "10:00 AM", start: 10, end: 11 }, // 10:00 AM - 11:00 AM
  { slot: "11:00 AM", start: 11, end: 12 }, // 11:00 AM - 12:00 PM
  { slot: "12:00 PM", start: 12, end: 13 }, // 12:00 PM - 1:00 PM
  { slot: "1:00 PM", start: 13, end: 14 }, // 1:00 PM - 2:00 PM
  { slot: "2:00 PM", start: 14, end: 15 }, // 2:00 PM - 3:00 PM
  { slot: "3:00 PM", start: 15, end: 16 }, // 3:00 PM - 4:00 PM
  { slot: "4:00 PM", start: 16, end: 17 }, // 4:00 PM - 5:00 PM
  { slot: "5:00 PM", start: 17, end: 18 }, // 5:00 PM - 6:00 PM
  { slot: "6:00 PM", start: 18, end: 19 }, // 6:00 PM - 7:00 PM
  { slot: "7:00 PM", start: 19, end: 20 }, // 7:00 PM - 8:00 PM
  { slot: "8:00 PM", start: 20, end: 21 }, // 8:00 PM - 9:00 PM
  { slot: "9:00 PM", start: 21, end: 22 }, // 9:00 PM - 10:00 PM
  { slot: "10:00 PM", start: 22, end: 23 }, // 10:00 PM - 11:00 PM
  { slot: "11:00 PM", start: 23, end: 24 }, // 11:00 PM - 12:00 AM
  { slot: "12:00 AM", start: 0, end: 1 }, // 12:00 AM - 1:00 AM
  { slot: "1:00 AM", start: 1, end: 2 }, // 1:00 AM - 2:00 AM
  { slot: "2:00 AM", start: 2, end: 3 }, // 2:00 AM - 3:00 AM
];

/**
 * Get current time slot based on current time (IST)
 * @returns {Object} Current time slot info with timing details
 */
function getCurrentTimeSlot() {
  const now = moment.tz("Asia/Kolkata");
  const currentHour = now.hour();
  const currentMinute = now.minute();

  // Check if we're in gaming hours (10 AM to 3 AM)
  if (currentHour >= 3 && currentHour < 10) {
    // Between 3 AM and 10 AM - return next slot (10 AM)
    return {
      slot: "10:00 AM - 11:00 AM",
      start: 10,
      end: 11,
      isActive: false,
      nextSlot: "10:00 AM - 11:00 AM",
      minutesUntilNext: 10 * 60 - (currentHour * 60 + currentMinute),
    };
  }

  // Find current active slot
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const timeSlot = TIME_SLOTS[i];

    if (currentHour >= timeSlot.start && currentHour < timeSlot.end) {
      const nextSlot =
        i < TIME_SLOTS.length - 1 ? TIME_SLOTS[i + 1] : TIME_SLOTS[0];
      const minutesIntoSlot = currentMinute;
      const remainingMinutes = 60 - minutesIntoSlot;

      // Format slot as hour-hour format
      const startHour12 =
        timeSlot.start > 12
          ? timeSlot.start - 12
          : timeSlot.start === 0
          ? 12
          : timeSlot.start;
      const endHour12 =
        timeSlot.end > 12
          ? timeSlot.end - 12
          : timeSlot.end === 0
          ? 12
          : timeSlot.end;
      const startAmPm = timeSlot.start >= 12 ? "PM" : "AM";
      const endAmPm = timeSlot.end >= 12 ? "PM" : "AM";

      return {
        slot: `${startHour12}:00 ${startAmPm} - ${endHour12}:00 ${endAmPm}`,
        start: timeSlot.start,
        end: timeSlot.end,
        isActive: true,
        nextSlot:
          i < TIME_SLOTS.length - 1
            ? `${
                nextSlot.start > 12
                  ? nextSlot.start - 12
                  : nextSlot.start === 0
                  ? 12
                  : nextSlot.start
              }:00 ${nextSlot.start >= 12 ? "PM" : "AM"} - ${
                nextSlot.end > 12
                  ? nextSlot.end - 12
                  : nextSlot.end === 0
                  ? 12
                  : nextSlot.end
              }:00 ${nextSlot.end >= 12 ? "PM" : "AM"}`
            : "10:00 AM - 11:00 AM",
        minutesRemaining: remainingMinutes,
        minutesIntoSlot: minutesIntoSlot,
      };
    }
  }

  // Fallback - shouldn't reach here
  return {
    slot: "10:00 AM - 11:00 AM",
    start: 10,
    end: 11,
    isActive: false,
    nextSlot: "10:00 AM - 11:00 AM",
    minutesUntilNext: 0,
  };
}

/**
 * Check if betting is currently allowed
 * Betting window: First 50 minutes of each hour
 * Admin period: Last 10 minutes of each hour
 */
function isBettingAllowed() {
  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  // Outside gaming hours (after 3 AM and before 10 AM)
  if (currentHour >= 3 && currentHour < 10) {
    return false;
  }

  // Within gaming hours - check if in betting window (0-49 minutes)
  return currentMinute < 50;
}

/**
 * Check if we're currently in admin period
 * Admin period: Last 10 minutes of each hour (50-59 minutes)
 */
function isAdminPeriod() {
  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  // Outside gaming hours (after 3 AM and before 10 AM)
  if (currentHour >= 3 && currentHour < 10) {
    return false;
  }

  // Within gaming hours - check if in admin period (50-59 minutes)
  return currentMinute >= 50;
}

/**
 * Get detailed timing information for current period
 */
function getTimingInfo() {
  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const currentTime = now.toISOString();

  const timeSlot = getCurrentTimeSlot();
  const bettingAllowed = isBettingAllowed();
  const adminPeriod = isAdminPeriod();

  let gameStatus;
  let remainingMinutes;

  if (currentHour >= 3 && currentHour < 10) {
    gameStatus = "CLOSED";
    remainingMinutes = 0;
  } else if (bettingAllowed) {
    gameStatus = "BETTING_OPEN";
    remainingMinutes = 50 - currentMinute;
  } else if (adminPeriod) {
    gameStatus = "ADMIN_PERIOD";
    remainingMinutes = 60 - currentMinute;
  } else {
    gameStatus = "TRANSITION";
    remainingMinutes = 0;
  }

  return {
    currentTime,
    currentTimeSlot: timeSlot.slot,
    nextTimeSlot: timeSlot.nextSlot,
    isBettingAllowed: bettingAllowed,
    isAdminPeriod: adminPeriod,
    remainingMinutes,
    gameStatus,
    schedule: {
      gameHours: "10:00 AM - 3:00 AM",
      roundDuration: "60 minutes",
      bettingWindow: "50 minutes",
      adminWindow: "10 minutes",
    },
  };
}

/**
 * Get all available time slots
 */
function getAllTimeSlots() {
  return TIME_SLOTS.map((slot) => ({
    slot: slot.slot,
    start: slot.start,
    end: slot.end,
  }));
}

/**
 * Check if a specific time slot is currently active
 */
function isTimeSlotActive(slotName) {
  const currentSlot = getCurrentTimeSlot();
  return currentSlot.slot === slotName;
}

/**
 * Get time slot by name
 */
function getTimeSlotByName(slotName) {
  return TIME_SLOTS.find((slot) => slot.slot === slotName);
}

/**
 * Get next admin period timing
 */
function getNextAdminPeriod() {
  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  let nextAdminHour = currentHour;
  let nextAdminMinute = 50;

  // If we're past 50 minutes, move to next hour
  if (currentMinute >= 50) {
    nextAdminHour = (currentHour + 1) % 24;
  }

  // If next admin period is outside gaming hours, go to next day 10 AM
  if (nextAdminHour >= 3 && nextAdminHour < 10) {
    nextAdminHour = 10;
    nextAdminMinute = 50;
  }

  return {
    hour: nextAdminHour,
    minute: nextAdminMinute,
    minutesUntil:
      (nextAdminHour - currentHour) * 60 + (nextAdminMinute - currentMinute),
  };
}

module.exports = {
  TIME_SLOTS,
  getCurrentTimeSlot,
  isBettingAllowed,
  isAdminPeriod,
  getTimingInfo,
  getAllTimeSlots,
  isTimeSlotActive,
  getTimeSlotByName,
  getNextAdminPeriod,
};
