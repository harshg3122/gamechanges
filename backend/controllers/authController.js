const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const { isValidMobile, isValidUsername } = require('../utils/numberUtils');

/**
 * User Registration
 */
const registerUser = async (req, res) => {
  try {
    const { username, mobileNumber, email, password, referral } = req.body;

    // Check if user already exists (username and mobile are required, email is optional)
    const queryConditions = [
      { username: username },
      { mobileNumber: mobileNumber }  // Mobile is compulsory, so always check
    ];
    // Only check email if provided
    if (email && email.trim() !== '') {
      queryConditions.push({ email: email });
    }
    const existingUser = await User.findOne({
      $or: queryConditions
    });

    if (existingUser) {
      let message = '';
      if (existingUser.username === username) message = 'Username already exists';
      else if (existingUser.mobileNumber === mobileNumber) message = 'Mobile number already registered';
      else if (email && email.trim() !== '' && existingUser.email === email) message = 'Email already registered';
      else message = 'User already exists';
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Validate input formats
    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      });
    }

    if (!isValidMobile(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'
      });
    }
    
    // Validate email format only if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }
    }

    // Create new user
    const userData = {
      username,
      mobileNumber,  // Mobile number is compulsory
      passwordHash: password // Will be hashed by pre-save middleware
    };
    if (email && email.trim() !== '') {
      userData.email = email;
    }
    // Add referral if provided
    if (referral && referral.trim() !== '') {
      userData.referral = referral;
    }
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, 'user');

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        referral: user.referral || '',
        walletBalance: user.walletBalance || user.wallet,
        isGuest: user.isGuest || false,
        role: user.role
      },
      token,
      refreshToken: token // For simplicity, using same token as refresh token
    });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

/**
 * User Login
 */
const loginUser = async (req, res) => {
  try {
    console.log('🚀 [loginUser] Login attempt started');
    // Debug: print incoming request body
    console.log('🔍 [loginUser] Incoming body:', req.body);
    // Accept both 'identifier' and 'email' for backward compatibility
    const { identifier, email, password } = req.body; 
    const loginIdentifier = identifier || email;

    console.log('🔍 [loginUser] Using identifier:', loginIdentifier);
    console.log('🔍 [loginUser] Password provided:', !!password);

    if (!loginIdentifier || !password) {
      console.log('❌ [loginUser] Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide username/email/mobile and password'
      });
    }

    console.log('🔍 [loginUser] Calling User.findByCredentials...');
    // Find user by credentials
    const user = await User.findByCredentials(loginIdentifier, password);
    console.log('✅ [loginUser] User authentication successful');

    // Generate JWT token
    console.log('🔍 [loginUser] Generating token...');
    const token = generateToken(user._id, 'user');

    // Update last login
    console.log('🔍 [loginUser] Updating last login...');
    await user.updateLastLogin();

    console.log('✅ [loginUser] Login process completed successfully');
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        referral: user.referral || '',
        walletBalance: user.walletBalance || user.wallet,
        isGuest: user.isGuest || false,
        role: user.role,
        selectedNumbers: user.selectedNumbers,
        totalWinnings: user.totalWinnings,
        totalLosses: user.totalLosses,
        gamesPlayed: user.gamesPlayed
      },
      token,
      refreshToken: token // For simplicity, using same token as refresh token
    });

  } catch (error) {
    console.error('❌ [loginUser] Login error occurred:', error.message);
    console.error('❌ [loginUser] Full error:', error);
    
    if (error.message === 'Invalid credentials') {
      console.log('❌ [loginUser] Returning 401 - Invalid credentials');
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile number/username or password'
      });
    }

    console.log('❌ [loginUser] Returning 500 - Internal server error');
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Admin Login
 */
const loginAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find admin by credentials (username or email)
    const admin = await Admin.findByCredentials(identifier, password);

    // Generate JWT token
    const token = generateToken(admin._id, 'admin');

    // Update last login
    await admin.updateLastLogin();

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (error.message.includes('temporarily locked')) {
      return res.status(423).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login'
    });
  }
};

/**
 * Refresh Token (Optional for future use)
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user/admin
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, decoded.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Logout (Optional - for token blacklisting in future)
 */
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you would add the token to a blacklist
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * Verify Token (for frontend to check if token is still valid)
 */
const verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (passed through authMiddleware)
    const userData = req.user.userData;
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: userData._id,
          username: userData.username || undefined,
          email: userData.email || undefined,
          mobileNumber: userData.mobileNumber || undefined,
          role: req.user.role,
          isActive: userData.isActive
        }
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token verification'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  refreshToken,
  logout,
  verifyToken
};
