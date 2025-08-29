const Settings = require('../models/Settings');

// Get system settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        gameTimings: '24/7',
        withdrawalLimits: 1000,
        contactInfo: 'admin@numbergame.com',
        paymentPhotoUrl: null
      });
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update system settings
exports.updateSettings = async (req, res) => {
  try {
    const { gameTimings, withdrawalLimits, contactInfo, paymentPhotoUrl } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    if (gameTimings !== undefined) settings.gameTimings = gameTimings;
    if (withdrawalLimits !== undefined) settings.withdrawalLimits = withdrawalLimits;
    if (contactInfo !== undefined) settings.contactInfo = contactInfo;
    if (paymentPhotoUrl !== undefined) settings.paymentPhotoUrl = paymentPhotoUrl;
    
    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
