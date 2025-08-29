const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false, // Email is now optional
        lowercase: true,
        trim: true,
        match: [
            /^$|^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, // Allow empty string or valid email
            'Please enter a valid email'
        ],
        default: undefined,
        sparse: true
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        unique: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'super-admin']
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    permissions: {
        canManageUsers: { type: Boolean, default: true },
        canManageWallets: { type: Boolean, default: true },
        canSetResults: { type: Boolean, default: true },
        canViewReports: { type: Boolean, default: true },
        canManageAdmins: { type: Boolean, default: false }
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date
}, {
    timestamps: true
});

// Index for faster queries
// Allow multiple admins with no email (null or empty string)
// Allow multiple admins with no email (null or empty string)
adminSchema.index({ email: 1 }, { unique: true, sparse: true });
adminSchema.index({ createdAt: -1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
adminSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to handle failed login attempts
adminSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: {
                loginAttempts: 1
            },
            $unset: {
                lockUntil: 1
            }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // In development, be more lenient with lockouts
    const maxAttempts = process.env.NODE_ENV === 'development' ? 10 : 5;
    const lockDuration = process.env.NODE_ENV === 'development' ? 15 * 60 * 1000 : 2 * 60 * 60 * 1000; // 15 min in dev, 2 hours in prod

    // Lock account after max failed attempts
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockDuration };
    }

    return this.updateOne(updates);
};

// Instance method to reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Instance method to update last login
adminSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to find admin by email
adminSchema.statics.findByCredentials = async function(identifier, password) {
    // identifier can be email or username
    const admin = await this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ],
        isActive: true
    });

    if (!admin) {
        throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (admin.isLocked) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    const isMatch = await admin.checkPassword(password);
    if (!isMatch) {
        // Increment login attempts on wrong password
        await admin.incLoginAttempts();
        throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
        await admin.resetLoginAttempts();
    }

    return admin;
};

// Transform toJSON to remove sensitive data
adminSchema.methods.toJSON = function() {
    const admin = this.toObject();
    delete admin.passwordHash;
    delete admin.loginAttempts;
    delete admin.lockUntil;
    delete admin.__v;
    return admin;
};

module.exports = mongoose.model('Admin', adminSchema);