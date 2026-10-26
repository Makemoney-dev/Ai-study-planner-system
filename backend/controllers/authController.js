const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'study_planner_super_secret_jwt_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register Logic
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const displayName = name || username;

    if (!displayName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name: displayName, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// Login Logic
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences: req.body } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, preferences: user?.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};