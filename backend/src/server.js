const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/database');

// Initialize Express app
const app = express();

// Trust proxy (for deployment)
app.set('trust proxy', 1);

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(` ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// ==========================================
// ROUTES
// ==========================================

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sthir-Mann API',
    version: '1.0.0',
    description: 'Mental wellness platform backend',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth'
    }
  });
});

// API version prefix
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'API v1',
    availableRoutes: [
      'GET  /api/v1/health',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'GET  /api/v1/auth/me',
      'POST /api/v1/auth/change-password',
      'POST /api/v1/auth/logout'
    ]
  });
});

// ==========================================
// API ROUTES
// ==========================================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes'); 

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); 

// Future routes (Phase 3+)
// const userRoutes = require('./routes/user.routes');
// app.use('/api/v1/users', userRoutes);
const personaRoutes = require('./routes/persona.routes');
app.use('/api/v1/personas', personaRoutes);

const assessmentRoutes = require('./routes/assessment.routes');
app.use('/api/v1/assessments', assessmentRoutes);

// const activityRoutes = require('./routes/activity.routes');
// app.use('/api/v1/activities', activityRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('MANSik Backend Server Started');
      console.log('='.repeat(50));
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`Database: ${process.env.DB_NAME}`);
      console.log(`JWT Expiry: ${process.env.JWT_EXPIRE}`);
      console.log(`Started at: ${new Date().toLocaleString()}`);
      console.log('='.repeat(50));
      console.log('Available Routes:');
      console.log('   POST /api/v1/auth/register');
      console.log('   POST /api/v1/auth/login');
      console.log('   GET  /api/v1/auth/me');
      console.log('   POST /api/v1/auth/change-password');
      console.log('   POST /api/v1/auth/logout');
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();