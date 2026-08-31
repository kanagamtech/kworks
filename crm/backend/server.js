require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhook');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.path !== '/api/health') {
    console.log(`[CRM API] ${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/webhook', webhookRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'KwOrKs CRM REST API',
    description: 'Enterprise Customer Relationship Management & Email Engine',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('CRM Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 KwOrKs CRM Server active on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints: http://localhost:${PORT}/api`);
  console.log(`✉️ Email & Automations Engine ready.`);
  console.log(`====================================================`);
});
