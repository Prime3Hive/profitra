const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');

// Import routes
const authRoutes = require('../../backend/server/routes/auth');
const userRoutes = require('../../backend/server/routes/users');
const investmentRoutes = require('../../backend/server/routes/investments');
const depositRoutes = require('../../backend/server/routes/deposits');
const transactionRoutes = require('../../backend/server/routes/transactions');
const adminRoutes = require('../../backend/server/routes/admin');

// Initialize database
const { initDatabase } = require('../../backend/server/database/init');

// Initialize Express app
const app = express();

// Initialize database
initDatabase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Profitra API',
    version: '1.0.0',
    status: 'online'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
