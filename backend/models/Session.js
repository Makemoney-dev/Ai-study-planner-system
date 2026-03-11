const mongoose = require('mongoose');

// Study Session (Pomodoro tracking)
const SessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, trim: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  type: { type: String, enum: ['pomodoro', 'short-break', 'long-break', 'free'], default: 'pomodoro' },
  plannedMinutes: { type: Number, required: true },
  actualMinutes: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  notes: { type: String },
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad'], default: 'good' },
  productivityScore: { type: Number, min: 0, max: 10, default: 7 },
  date: { type: Date, default: () => new Date().setHours(0,0,0,0) }
});

// Flashcard model
const FlashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, trim: true },
  topic: { type: String, trim: true },
  cards: [{
    front: { type: String, required: true },
    back: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    timesReviewed: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    nextReview: { type: Date, default: Date.now }
  }],
  aiGenerated: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Alarm model
const AlarmSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String },
  time: { type: Date, required: true },
  repeat: { type: String, enum: ['none', 'daily', 'weekdays', 'weekly'], default: 'none' },
  subject: { type: String },
  isActive: { type: Boolean, default: true },
  triggered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Session: mongoose.model('Session', SessionSchema),
  Flashcard: mongoose.model('Flashcard', FlashcardSchema),
  Alarm: mongoose.model('Alarm', AlarmSchema)
};
