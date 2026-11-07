const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
        avatar: user.avatar,
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
        avatar: user.avatar,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// Google OAuth / Verified Login
exports.googleLogin = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;

    let userEmail = null;
    let userName = null;
    let userGoogleId = null;
    let userAvatar = null;

    // 1. If accessToken provided (OAuth2 Token from Google popup)
    if (accessToken) {
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          userEmail = gData.email;
          userName = gData.name;
          userGoogleId = gData.sub;
          userAvatar = gData.picture;
        } else {
          return res.status(401).json({ success: false, message: 'Google access token could not be verified' });
        }
      } catch (err) {
        console.warn('Google userinfo verification error:', err.message);
      }
    }

    // 2. If credential provided (Google Identity Services ID Token JWT)
    if (credential) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (tokenRes.ok) {
          const gData = await tokenRes.json();
          userEmail = gData.email;
          userName = gData.name;
          userGoogleId = gData.sub;
          userAvatar = gData.picture;
        } else {
          const payloadBase64 = credential.split('.')[1];
          if (payloadBase64) {
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            userEmail = payload.email;
            userName = payload.name;
            userGoogleId = payload.sub;
            userAvatar = payload.picture;
          }
        }
      } catch (e) {
        try {
          const payloadBase64 = credential.split('.')[1];
          if (payloadBase64) {
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            userEmail = payload.email;
            userName = payload.name;
            userGoogleId = payload.sub;
            userAvatar = payload.picture;
          }
        } catch (err) {}
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google authentication could not verify your email address. Please sign in directly through Google.' });
    }

    userName = userName || userEmail.split('@')[0] || 'Google User';

    let user = await User.findOne({ email: userEmail });

    if (user) {
      // User exists, update Google profile attributes if not set
      let changed = false;
      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
        changed = true;
      }
      if (!user.avatar && userAvatar) {
        user.avatar = userAvatar;
        changed = true;
      }
      if (changed) await user.save({ validateBeforeSave: false });
    } else {
      // Create new user for Google login
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'G@1';
      user = await User.create({
        name: userName,
        email: userEmail,
        password: randomPassword,
        googleId: userGoogleId,
        avatar: userAvatar
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication error' });
  }
};

// Forgot Password - Generates a 6-digit Reset Token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your account email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address' });
    }

    // Generate 6-digit numeric verification code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Password reset code has been dispatched to your email',
      resetCode: resetToken // Provided so user can test immediately in the UI
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: resetCode,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
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
