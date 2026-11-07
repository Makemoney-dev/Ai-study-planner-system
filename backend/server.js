const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend files (for local runs)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serverless-compatible MongoDB connection caching
const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-study-planner';
const fallbackUri = 'mongodb://127.0.0.1:27017/ai-study-planner';

let cachedDbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  if (cachedDbPromise) {
    return cachedDbPromise;
  }

  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
  let targetUri = primaryUri;

  if (isVercel && (targetUri.includes('127.0.0.1') || targetUri.includes('localhost'))) {
    throw new Error('Local MongoDB (127.0.0.1) cannot be reached in Vercel serverless. Please add MONGO_URI in your Vercel Project Settings -> Environment Variables with your MongoDB Atlas URI.');
  }

  cachedDbPromise = mongoose.connect(targetUri, {
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 8000,
  }).then((m) => {
    console.log('✅ MongoDB Connected successfully');
    return m;
  }).catch(async (err) => {
    cachedDbPromise = null;
    if (!isVercel && targetUri !== fallbackUri) {
      console.log('🔄 Trying local fallback MongoDB...');
      return mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
    }
    throw err;
  });

  return cachedDbPromise;
}

// Middleware: ensure DB is connected before processing any API request
app.use(async (req, res, next) => {
  // If static file or root HTML, don't block on DB
  if (req.method === 'GET' && (req.path === '/' || req.path === '/health' || req.path === '/api/health' || req.path === '/test' || req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.png') || req.path.endsWith('.svg') || req.path.endsWith('.ico'))) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection error on API request:', err.message);
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
    return res.status(500).json({
      success: false,
      message: isVercel
        ? `Database connection error (${err.message}). Please add MONGO_URI in your Vercel Project Settings -> Environment Variables with your MongoDB Atlas connection string, and ensure MongoDB Atlas Network Access whitelist includes 0.0.0.0/0.`
        : `Database connection error (${err.message}). Ensure MongoDB is running.`
    });
  }
});

// Mount API routes at both /api and / to support all Vercel path rewrites
app.use('/api', routes);
app.use('/', routes);

// Health check / test routes
app.get('/test', (req, res) => res.send('Backend is working!'));
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI Study Planner API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});
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
if (!process.env.VERCEL && !process.env.VERCEL_ENV && !process.env.NOW_REGION) {
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`✨ AI Study Planner is ready!`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1;
        console.warn(`Port ${port} in use, trying port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error('Server error:', err);
      }
    });
  };
  startServer(PORT);
  // Connect eagerly in local development
  connectDB().catch(() => {});
}

module.exports = app;