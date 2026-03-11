const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title too long']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description too long']
  },
  subject: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  tags: [{ type: String, trim: true }],
  dueDate: { type: Date },
  completedAt: { type: Date },
  estimatedMinutes: { type: Number, default: 30 },
  actualMinutes: { type: Number, default: 0 },
  studyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan',
    default: null
  },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
