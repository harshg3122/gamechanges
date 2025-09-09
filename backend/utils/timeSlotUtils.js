/**
 * Utility functions for handling time slots
 */

/**
 * Get the current time slot based on the current time
 * @returns {Object} Object containing slot and next slot information
 */
const getCurrentTimeSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Define time slots
    const timeSlots = [
        { slot: '10-11', start: 10, end: 11 },
        { slot: '11-12', start: 11, end: 12 },
        { slot: '12-1', start: 12, end: 13 },
        { slot: '1-2', start: 13, end: 14 },
        { slot: '2-3', start: 14, end: 15 },
        { slot: '3-4', start: 15, end: 16 },
        { slot: '4-5', start: 16, end: 17 },
        { slot: '5-6', start: 17, end: 18 },
        { slot: '6-7', start: 18, end: 19 },
        { slot: '7-8', start: 19, end: 20 },
        { slot: '8-9', start: 20, end: 21 },
        { slot: '9-10', start: 21, end: 22 }
    ];
    
    // Find current time slot
    let currentSlot = timeSlots.find(slot => hour >= slot.start && hour < slot.end);
    
    // If outside defined slots, use the next available slot
    if (!currentSlot) {
        if (hour >= 22 || hour < 10) {
            currentSlot = timeSlots[0]; // Default to first slot
        }
    }
    
    // Find next slot
    const currentIndex = timeSlots.findIndex(slot => slot.slot === currentSlot.slot);
    const nextIndex = (currentIndex + 1) % timeSlots.length;
    const nextSlot = timeSlots[nextIndex];
    
    // Calculate minutes remaining in current slot
    const minutesRemaining = (currentSlot.end - hour) * 60 - minute;
    
    return {
        slot: currentSlot.slot,
        nextSlot: nextSlot.slot,
        minutesRemaining,
        startHour: currentSlot.start,
        endHour: currentSlot.end
    };
};

/**
 * Parse a time slot string into start and end hours
 * @param {String} timeSlot - Time slot in format "10-11"
 * @returns {Object} Object containing start and end hours
 */
const parseTimeSlot = (timeSlot) => {
    const [startStr, endStr] = timeSlot.split('-');
    
    let startHour = parseInt(startStr);
    let endHour = parseInt(endStr);
    
    // Adjust for PM hours if needed
    if (startHour < 10 && endHour < 10) {
        startHour += 12;
        endHour += 12;
    } else if (endHour < startHour) {
        endHour += 12;
    }
    
    return {
        startHour,
        endHour
    };
};

module.exports = {
    getCurrentTimeSlot,
    parseTimeSlot
};