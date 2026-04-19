const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, subject, search, sort = '-createdAt' } = req.query;
    
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (search) filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') }
    ];

    const tasks = await Task.find(filter).sort(sort);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const wasCompleted = task.status === 'completed';
    const nowCompleted = req.body.status === 'completed';

    Object.assign(task, req.body);
    await task.save();

    // Update user stats if task just completed
    if (!wasCompleted && nowCompleted) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.totalTasksCompleted': 1 }
      });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting task' });
  }
};

// GET /api/tasks/stats
exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await Task.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    const result = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
    stats.forEach(s => { result[s._id] = s.count; });
    
    res.json({ success: true, stats: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};
