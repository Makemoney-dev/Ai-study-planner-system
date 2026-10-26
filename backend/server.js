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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

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

// SPA fallback: any non-API route serves frontend/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-study-planner';
const fallbackUri = 'mongodb://127.0.0.1:27017/ai-study-planner';

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✨ AI Study Planner is ready!`);
});

// Database connection logic with local fallback
async function connectDB() {
  try {
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected successfully');
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB URI (${err.message})`);
    if (primaryUri !== fallbackUri) {
      console.log('🔄 Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/ai-study-planner)...');
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Local MongoDB Connected successfully');
      } catch (localErr) {
        console.error('❌ Local MongoDB connection failed:', localErr.message);
      }
    }
  }
}

connectDB();

module.exports = app;