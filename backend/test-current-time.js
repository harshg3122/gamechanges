require('dotenv').config();
const { getCurrentTimeSlot, getTimingInfo, getAllTimeSlots } = require('./utils/timeSlots');

console.log('🕐 Current Time Slot Test');
console.log('========================');

// Get current time slot
const currentSlot = getCurrentTimeSlot();
console.log('\n📅 Current Time Slot:');
console.log(JSON.stringify(currentSlot, null, 2));

// Get detailed timing info
const timingInfo = getTimingInfo();
console.log('\n⏰ Detailed Timing Info:');
console.log(JSON.stringify(timingInfo, null, 2));

// Get all time slots
const allSlots = getAllTimeSlots();
console.log('\n📋 All Available Time Slots:');
allSlots.forEach((slot, index) => {
  console.log(`${index + 1}. ${slot.slot} (${slot.start}:00 - ${slot.end}:00)`);
});

console.log('\n🎯 Current Round Analysis:');
console.log(`- Current Slot: ${currentSlot.slot}`);
console.log(`- Is Active: ${currentSlot.isActive}`);
console.log(`- Next Slot: ${currentSlot.nextSlot}`);
console.log(`- Minutes Remaining: ${currentSlot.minutesRemaining || 'N/A'}`);
console.log(`- Game Status: ${timingInfo.gameStatus}`);
console.log(`- Betting Allowed: ${timingInfo.isBettingAllowed}`);
console.log(`- Admin Period: ${timingInfo.isAdminPeriod}`);
