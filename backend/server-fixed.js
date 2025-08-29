require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// Trust proxy for environments like Render, Heroku, etc.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from any origin in development
    if(process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // In production, specify allowed origins
    const allowedOrigins = ['https://your-frontend-domain.com', 'https://your-admin-panel.com'];
    if(!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Database connection
const connectDB = async () => {
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
const seedAdminUser = async () => {
  try {
    const Admin = require('./models/Admin');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@numbergame.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const adminExists = await Admin.findOne({ email: adminEmail });
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      await Admin.create({
        email: adminEmail,
        passwordHash,
        fullName: 'System Administrator',
        role: 'super-admin',
        permissions: {
          canManageUsers: true,
          canManageWallets: true,
          canSetResults: true,
          canViewReports: true,
          canManageAdmins: true
        },
        isActive: true
      });
      
      console.log('✅ Admin user seeded successfully');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`🔑 Admin Password: ${adminPassword}`);
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
  }
};

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const resultRoutes = require('./routes/resultRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const qrRoutes = require('./routes/qrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const agentRoutes = require('./routes/agentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminPanelRoutes = require('./routes/adminPanelRoutes');

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Number Game API',
    version: '1.0.0',
    availableRoutes: {
      auth: '/api/auth',
      user: '/api/user', 
      game: '/api/game',
      adminPanel: '/api/admin-panel'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin-panel', adminPanelRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Number Game API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      user: '/api/user',
      game: '/api/game',
      adminPanel: '/api/admin-panel'
    },
    status: 'Running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // JWT error
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      user: '/api/user',
      game: '/api/game',
      adminPanel: '/api/admin-panel'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`🔧 Health: http://localhost:${PORT}/health`);
      console.log(`👑 Admin Panel: http://localhost:${PORT}/api/admin-panel`);
      console.log(`🎮 Game API: http://localhost:${PORT}/api/game`);
      console.log('\n✅ Backend is ready for testing!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

startServer();
