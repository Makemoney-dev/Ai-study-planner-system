const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (for local runs)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serverless-compatible MongoDB connection caching
const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-study-planner';
const fallbackUri = 'mongodb://127.0.0.1:27017/ai-study-planner';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected successfully');
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed: ${err.message}`);
    if (primaryUri !== fallbackUri && !process.env.VERCEL) {
      console.log('🔄 Trying local fallback MongoDB...');
      await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Local MongoDB Connected successfully');
    } else {
      throw err;
    }
  }
}

// Middleware: ensure DB is connected before processing any /api request
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection error on API request:', err.message);
    return res.status(500).json({
      success: false,
      message: `Database connection error (${err.message}). Please check MONGO_URI in your Vercel Project Settings (Environment Variables) and ensure MongoDB Atlas IP Access is set to 0.0.0.0/0.`
    });
  }
});

// API Routes
app.use('/api', routes);

// Health check / test routes
app.get('/test', (req, res) => res.send('Backend is working!'));
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI Study Planner API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback: any non-API route serves frontend/index.html (for local runs)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Only start the HTTP listener when NOT running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✨ AI Study Planner is ready!`);
  });
  // Connect eagerly in local development
  connectDB().catch(() => {});
}

module.exports = app;