const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');

// Auth routes
const authController = require('../controllers/authController');
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);
router.put('/auth/preferences', protect, authController.updatePreferences);

// Direct default token access (no login required)
router.get('/auth/default-token', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'explorer@synapse.ai' });
    if (!user) {
      user = await User.create({
        name: 'Explorer',
        email: 'explorer@synapse.ai',
        password: 'default_quantum_pass_123'
      });
    }
    const jwtSecret = process.env.JWT_SECRET || 'study_planner_super_secret_jwt_key';
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '365d' });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (e) {
    res.json({
      success: true,
      token: 'guest_token',
      user: {
        id: 'guest_id',
        name: 'Explorer',
        email: 'explorer@synapse.ai'
      }
    });
  }
});

// Task routes
const taskController = require('../controllers/taskController');
router.get('/tasks', protect, taskController.getTasks);
router.post('/tasks', protect, taskController.createTask);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);
router.get('/tasks/stats', protect, taskController.getTaskStats);

// AI routes
const aiController = require('../controllers/aiController');
router.post('/ai/generate-study-plan', protect, aiController.generateStudyPlan);
router.post('/ai/chat', protect, aiController.chat);
router.post('/ai/flashcards', protect, aiController.generateFlashcards);
router.get('/ai/flashcards', protect, aiController.getFlashcards);
router.post('/ai/summarize', protect, aiController.summarize);
router.get('/ai/motivation', protect, aiController.getMotivation);

// Analytics & Sessions
const analyticsController = require('../controllers/analyticsController');
router.get('/analytics', protect, analyticsController.getAnalytics);
router.post('/sessions', protect, analyticsController.createSession);
router.put('/sessions/:id/complete', protect, analyticsController.completeSession);

// Alarms
router.post('/alarms', protect, analyticsController.setAlarm);
router.get('/alarms', protect, analyticsController.getAlarms);
router.delete('/alarms/:id', protect, analyticsController.deleteAlarm);

// Study Plans
router.get('/study-plans', protect, async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id }).sort('-createdAt');
    res.json({ success: true, plans });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/study-plans/:id', protect, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
