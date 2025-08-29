const mongoose = require('mongoose');
const User = require('./models/User');
const Agent = require('./models/Agent');

async function checkReferrals() {
  try {
    await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game');
    console.log('Connected to database');

    // Get agent
    const agent = await Agent.findById('689b8b652739e330b0a10ccc');
    console.log('Agent:', agent ? agent.referralCode : 'Not found');

    // Check users with this referral code
    const users = await User.find({ referral: 'DELTEST' });
    console.log('Users with DELTEST referral:', users.length);

    // Check all users with referrals
    const allReferrals = await User.find({ referral: { $exists: true, $ne: null } });
    console.log('Total users with referrals:', allReferrals.length);
    
    if (allReferrals.length > 0) {
      console.log('Referral codes used:', allReferrals.map(u => u.referral));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkReferrals();
