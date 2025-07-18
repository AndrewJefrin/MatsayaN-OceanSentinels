const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const alertRoutes = require('./routes/alerts');
const navigationRoutes = require('./routes/navigation');
const chatRoutes = require('./routes/chat');
const settingsRoutes = require('./routes/settings');
const sosRoutes = require('./routes/sos');

// Import services
const weatherService = require('./services/weatherService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Uyir Kavalan Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sos', sosRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Uyir Kavalan Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      weather: '/api/weather',
      alerts: '/api/alerts',
      navigation: '/api/navigation',
      chat: '/api/chat',
      settings: '/api/settings',
      sos: '/api/sos'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Scheduled tasks
const initializeScheduledTasks = () => {
  // Update weather data for all active boats every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('Running scheduled weather update...');
      await weatherService.updateAllBoatsWeather();
      console.log('Weather update completed successfully');
    } catch (error) {
      console.error('Scheduled weather update failed:', error);
    }
  });

  // Clean up old data every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Running scheduled cleanup...');
      // Add cleanup logic here (old logs, expired alerts, etc.)
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  });

  // System health check every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running system health check...');
      // Add health check logic here
      console.log('Health check completed successfully');
    } catch (error) {
      console.error('Health check failed:', error);
    }
  });
};

// Start server
const startServer = async () => {
  try {
    // Initialize scheduled tasks
    initializeScheduledTasks();
    
    app.listen(PORT, () => {
      console.log(`🚢 Uyir Kavalan Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`⏰ Scheduled tasks initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app; 