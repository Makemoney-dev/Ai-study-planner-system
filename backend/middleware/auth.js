const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const jwtSecret = process.env.JWT_SECRET || 'study_planner_super_secret_jwt_key';

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        return next();
      }
    } catch (error) {
      // Token expired or invalid, fall through to default guest user
    }
  }

  // Seamless default user access without requiring login
  try {
    let defaultUser = await User.findOne({ email: 'explorer@synapse.ai' });
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'Explorer',
        email: 'explorer@synapse.ai',
        password: 'default_quantum_pass_123'
      });
    }
    req.user = defaultUser;
    next();
  } catch (err) {
    // Fallback if DB query fails
    req.user = {
      _id: 'default_explorer_id',
      id: 'default_explorer_id',
      name: 'Explorer',
      email: 'explorer@synapse.ai',
      stats: { totalHoursStudied: 0, totalTasksCompleted: 0, currentStreak: 1 }
    };
    next();
  }
};

module.exports = { protect };
