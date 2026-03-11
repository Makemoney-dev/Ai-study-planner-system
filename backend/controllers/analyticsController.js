const { Session, Alarm } = require('../models/Session');
const User = require('../models/User');
const Task = require('../models/Task');

// GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Weekly sessions
    const weeklySessions = await Session.find({
      user: userId,
      startTime: { $gte: weekAgo },
      completed: true
    });

    // Build daily hours chart data
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { minutes: 0, sessions: 0, date: key };
    }

    weeklySessions.forEach(s => {
      const key = new Date(s.startTime).toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].minutes += s.actualMinutes || s.plannedMinutes;
        dailyData[key].sessions += 1;
      }
    });

    const weeklyHours = weeklySessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0) / 60;

    // Task stats
    const taskStats = await Task.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const tasks = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
    taskStats.forEach(t => { tasks[t._id] = t.count; });

    // Subject breakdown
    const subjectData = await Session.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), startTime: { $gte: monthAgo } } },
      { $group: { _id: '$subject', totalMinutes: { $sum: '$actualMinutes' }, sessions: { $sum: 1 } } },
      { $sort: { totalMinutes: -1 } },
      { $limit: 6 }
    ]);

    const user = await User.findById(userId);

    res.json({
      success: true,
      analytics: {
        totalHoursStudied: user.stats.totalHoursStudied,
        totalTasksCompleted: user.stats.totalTasksCompleted,
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        dailyData: Object.values(dailyData),
        tasks,
        subjectBreakdown: subjectData,
        totalSessions: await Session.countDocuments({ user: userId })
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sessions
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/sessions/:id/complete
exports.completeSession = async (req, res) => {
  try {
    const { actualMinutes, mood, productivityScore, notes } = req.body;
    
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { completed: true, actualMinutes, mood, productivityScore, notes, endTime: Date.now() },
      { new: true }
    );

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Update user study hours
    const hoursStudied = (actualMinutes || 0) / 60;
    const today = new Date().setHours(0,0,0,0);
    const user = await User.findById(req.user.id);
    
    const lastStudy = user.stats.lastStudyDate ? new Date(user.stats.lastStudyDate).setHours(0,0,0,0) : null;
    const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);
    
    let streakUpdate = {};
    if (lastStudy === today) {
      // Already studied today, just add hours
      streakUpdate = {};
    } else if (lastStudy === yesterday) {
      // Continue streak
      streakUpdate = { $inc: { 'stats.currentStreak': 1 } };
    } else {
      // Reset streak
      streakUpdate = { $set: { 'stats.currentStreak': 1 } };
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalHoursStudied': hoursStudied },
      $set: { 'stats.lastStudyDate': new Date() },
      $max: { 'stats.longestStreak': user.stats.currentStreak + 1 },
      ...streakUpdate
    });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/alarms
exports.setAlarm = async (req, res) => {
  try {
    const alarm = await Alarm.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, alarm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/alarms
exports.getAlarms = async (req, res) => {
  try {
    const alarms = await Alarm.find({ user: req.user.id, isActive: true }).sort('time');
    res.json({ success: true, alarms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/alarms/:id
exports.deleteAlarm = async (req, res) => {
  try {
    await Alarm.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Alarm deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
