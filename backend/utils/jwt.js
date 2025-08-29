const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user or admin
 * @param {string} id - User/Admin ID
 * @param {string} role - 'user' or 'admin'
 * @returns {string} JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate refresh token (optional for future use)
 * @param {string} id - User/Admin ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};
