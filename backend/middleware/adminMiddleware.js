/**
 * Admin role verification middleware
 * Must be used after authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization.'
    });
  }
};

/**
 * Super admin role verification middleware
 * For high-privilege operations
 */
const superAdminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'admin' || req.user.userData.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization.'
    });
  }
};

/**
 * Permission-based middleware factory
 * Checks specific admin permissions
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const adminData = req.user.userData;
      if (!adminData.permissions || !adminData.permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Permission '${permission}' required.`
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check.'
      });
    }
  };
};

module.exports = {
  adminMiddleware,
  superAdminMiddleware,
  requirePermission
};
