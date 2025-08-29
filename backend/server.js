require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// --- Seed test admin and agent for API tests ---
const Admin = require('./models/Admin');
const Agent = require('./models/Agent');
const bcrypt = require('bcrypt');

app.use(express.json());

async function seedTestAccounts() {
    // Seed admin
    const adminEmail = '963sohamraut@gmail.com';
    const adminPassword = 'admin123';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        admin = await Admin.create({
            email: adminEmail,
            username: 'apitestadmin',
            passwordHash,
            fullName: 'API Test Admin',
            role: 'admin',
            permissions: { canViewReports: true, canManageUsers: true }
        });
        console.log('Seeded test admin');
    }

    // Seed agent
    const agentMobile = 'agent1';
    const agentPassword = 'agentpass';
    let agent = await Agent.findOne({ mobile: agentMobile });
    if (!agent) {
        agent = await Agent.create({
            fullName: 'API Test Agent',
            mobile: agentMobile,
            password: agentPassword,
            referralCode: 'apitestref',
        });
        console.log('Seeded test agent');
    }
}

seedTestAccounts().catch(console.error);

// Health check endpoint for API monitoring
app.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

// Test endpoint for frontend debugging
app.get('/api/test-auth', (req, res) => {
    const authHeader = req.header('Authorization');
    res.json({
        success: true,
        message: 'Auth test endpoint',
        headers: {
            authorization: authHeader,
            'content-type': req.header('Content-Type'),
            origin: req.header('Origin')
        },
        timestamp: new Date().toISOString()
    });
});

// Import middleware
const { securityHeaders, requestLogger } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes'); // Temporarily disabled
const resultRoutes = require('./routes/resultRoutes');
const gameRoutes = require('./routes/gameRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const qrRoutes = require('./routes/qrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const agentRoutes = require('./routes/agentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminPanelRoutes = require('./routes/adminPanelRoutes');
const testRoutes = require('./routes/testRoutes');

// Socket.IO setup for real-time notifications
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Store connected clients
let connectedAdmins = {};
io.on('connection', (socket) => {
    // Identify admin by token or ID if needed
    socket.on('registerAdmin', (adminId) => {
        connectedAdmins[adminId] = socket.id;
    });
    socket.on('disconnect', () => {
        for (const [adminId, id] of Object.entries(connectedAdmins)) {
            if (id === socket.id) delete connectedAdmins[adminId];
        }
    });
});

// Pass Socket.IO instance to notificationController
const notificationController = require('./controllers/notificationController');
notificationController.setSocketIO(io);

// Trust proxy for environments like Render, Heroku, etc.
// This fixes the express-rate-limit X-Forwarded-For warning
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests from any origin in development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        // In production, specify allowed origins
        const allowedOrigins = ['https://your-frontend-domain.com', 'https://your-admin-panel.com'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('CORS policy violation'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization']
}));

// Body parsing middleware with better error handling
app.use(express.json({
    limit: '10mb',
    strict: false,
    type: 'application/json'
}));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Custom middleware to handle empty/null JSON bodies
app.use((req, res, next) => {
    // Handle empty or null request bodies for JSON content-type
    if (req.is('application/json') && (req.body === null || req.body === undefined)) {
        req.body = {};
    }
    next();
});

// Add request debugging middleware for production debugging
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, JSON.stringify(req.body));
        next();
    });
}

// Request logging
if (process.env.NODE_ENV !== 'production') {
    app.use(requestLogger);
}

// Handle preflight requests
app.options('*', cors());

// Database connection
const connectDB = async() => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/numbergame';

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB connected successfully');

        // Seed admin user if doesn't exist
        await seedAdminUser();

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Seed admin user
const seedAdminUser = async() => {
    try {
        const adminExists = await Admin.findOne({
            $or: [
                { email: process.env.ADMIN_EMAIL },
                { username: process.env.ADMIN_USERNAME || 'admin' }
            ]
        });

        if (!adminExists) {
            const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);

            await Admin.create({
                email: process.env.ADMIN_EMAIL || 'admin@numbergame.com',
                username: process.env.ADMIN_USERNAME || 'admin', // <-- I added this line
                passwordHash: adminPassword,
                fullName: 'System Administrator',
                role: 'super-admin',
                permissions: {
                    canManageUsers: true,
                    canManageWallets: true,
                    canSetResults: true,
                    canViewReports: true,
                    canManageAdmins: true
                }
            });

            console.log('✅ Admin user seeded successfully');
            console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || 'admin@numbergame.com'}`);
            console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
        }
    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message);
    }
};

// Routes
// Base API route handler to show available routes
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Number Game API',
        version: '1.0.0',
        availableRoutes: ['/api/auth', '/api/user', '/api/admin', '/api/game'],
        documentation: '/api/docs'
    });
});

// Auth routes - base handler
app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: 'Auth API routes',
        availableRoutes: [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/admin/login',
            '/api/auth/refresh',
            '/api/auth/logout',
            '/api/auth/verify'
        ]
    });
});

// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
// app.use('/api/admin', adminRoutes); // Temporarily disabled
app.use('/api/results', resultRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin-panel', adminPanelRoutes);
app.use('/api/test', testRoutes);

// Routes
const imageRoutes = require("./routes/imageRoutes");
app.use("/api/images", imageRoutes);

// New API routes for additional features
// app.use('/api/admin', adminRoutes); // Temporarily disabled
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auditlogs', auditLogRoutes);
app.use('/api/test', testRoutes);

// Health check routes (both /health and /api/health)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Admin login test endpoint
app.get('/api/admin-test', async(req, res) => {
    try {
        const Admin = require('./models/Admin');
        const admins = await Admin.find({}, 'email username role isActive').limit(5);
        res.json({
            success: true,
            message: 'Admin accounts available',
            data: admins,
            loginUrl: '/api/admin-panel/login',
            testCredentials: {
                username: 'admin',
                password: 'admin123'
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Error fetching admin data',
            error: error.message
        });
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Number Game API Server',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            user: '/api/user',
            admin: '/api/admin',
            game: '/api/game'
        },
        status: 'Running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API documentation route (basic)
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        message: 'Number Game API Documentation',
        version: '1.0.0',
        baseURL: `${req.protocol}://${req.get('host')}/api`,
        endpoints: {
            authentication: {
                'POST /auth/register': 'Register new user',
                'POST /auth/login': 'User login',
                'POST /auth/admin/login': 'Admin login',
                'POST /auth/refresh': 'Refresh token',
                'POST /auth/logout': 'Logout',
                'GET /auth/verify': 'Verify token'
            },
            user: {
                'GET /user/profile': 'Get user profile',
                'PUT /user/profile': 'Update user profile',
                'GET /user/selections': 'Get user selections history',
                'GET /user/wallet/transactions': 'Get wallet transactions',
                'GET /user/results': 'Get user game results',
                'GET /user/stats': 'Get user statistics',
                'POST /user/change-password': 'Change password'
            },
            game: {
                'POST /game/select': 'Select number for game',
                'GET /game/round/current': 'Get current round info',
                'GET /game/numbers/:classType': 'Get valid numbers for class',
                'GET /game/info': 'Get game rules and info',
                'GET /game/results/recent': 'Get recent results',
                'DELETE /game/selections/:id': 'Cancel selection',
                'GET /game/selections/current': 'Get current selections'
            },
            admin: {
                'GET /admin/dashboard': 'Get dashboard stats',
                'GET /admin/users': 'Get all users',
                'GET /admin/users/:id': 'Get user details',
                'POST /admin/users/:id/toggle-status': 'Toggle user status',
                'POST /admin/wallet/manage': 'Manage user wallet',
                'POST /admin/results/set': 'Set game results',
                'GET /admin/results': 'Get all results',
                'GET /admin/results/:roundId/winners': 'Get round winners'
            }
        }
    });
});

// Require admin authentication middleware
const requireAdminAuth = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const admin = await Admin.findById(decoded.id);

        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Access denied. Invalid admin.' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

// Remove multer upload middleware and update QR code routes
app.post('/api/admin/update-qr-codes', requireAdminAuth, async(req, res) => {
    try {
        const { method, imageUrl } = req.body;

        if (!method || !imageUrl) {
            return res.status(400).json({ success: false, message: 'Method and imageUrl are required' });
        }

        const validMethods = ['upi', 'phonepe', 'paytm', 'gpay'];
        if (!validMethods.includes(method)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        // Use mongoose connection
        const result = await mongoose.connection.db.collection('qr_codes').updateOne({ method: method }, {
            $set: {
                imageUrl: imageUrl,
                updatedAt: new Date()
            }
        }, { upsert: true });

        res.json({
            success: true,
            message: 'QR code updated successfully',
            result: result
        });
    } catch (error) {
        console.error('Error updating QR code:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get QR codes - update to return imageUrl
app.get('/api/qr-codes', async(req, res) => {
    try {
        const qrCodes = await mongoose.connection.db.collection('qr_codes').find({}).toArray();

        // Transform to include imageUrl instead of imagePath
        const transformedCodes = qrCodes.map(code => ({
            _id: code._id,
            method: code.method,
            imageUrl: code.imageUrl,
            updatedAt: code.updatedAt
        }));

        res.json({ success: true, qrCodes: transformedCodes });
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific QR code by method
app.get('/api/qr-codes/:method', async(req, res) => {
    try {
        const { method } = req.params;
        const qrCode = await mongoose.connection.db.collection('qr_codes').findOne({ method: method });

        if (!qrCode) {
            return res.status(404).json({ success: false, message: 'QR code not found' });
        }

        res.json({
            success: true,
            qrCode: {
                _id: qrCode._id,
                method: qrCode.method,
                imageUrl: qrCode.imageUrl,
                updatedAt: qrCode.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching QR code:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        requestedPath: req.originalUrl,
        method: req.method,
        availableRoutes: ['/api/auth', '/api/user', '/api/admin', '/api/game']
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    // Body parser JSON error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in request body',
            details: 'Please ensure your request contains valid JSON data'
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token has expired'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('📦 MongoDB connection closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('📦 MongoDB connection closed.');
        process.exit(0);
    });
});

// Cron job for automated tasks (optional)
if (process.env.NODE_ENV === 'production') {
    // Example: Clean up expired rounds every hour
    cron.schedule('0 * * * *', async() => {
        console.log('🔄 Running scheduled cleanup tasks...');
        // Add cleanup logic here if needed
    });
}

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async() => {
    await connectDB();

    // Start auto result generation job
    const { startAutoResultJob } = require('./scripts/autoResultJobNew');
    startAutoResultJob();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
        console.log(`🎯 Auto result job started`);
    });
};


startServer().catch(console.error);

module.exports = app;