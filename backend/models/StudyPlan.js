const mongoose = require('mongoose');

const DayPlanSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dayLabel: { type: String },
  sessions: [{
    subject: String,
    topic: String,
    duration: Number, // minutes
    type: { type: String, enum: ['study', 'revision', 'practice', 'break'], default: 'study' },
    startTime: String,
    endTime: String,
    completed: { type: Boolean, default: false },
    notes: String
  }],
  totalStudyMinutes: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { _id: false });

const StudyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  subjects: [{ 
    name: String, 
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    hoursNeeded: Number,
    color: String
  }],
  examDate: { type: Date, required: true },
  dailyAvailableHours: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  plan: [DayPlanSchema],
  aiSuggestions: { type: String },
  learningStrategies: [String],
  isActive: { type: Boolean, default: true },
  progress: { type: Number, default: 0 }, // percentage
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.studyPlan || mongoose.model('studyPlan', StudyPlanSchema);
