# 📚 AI Smart Study Planner

A production-ready, full-stack AI-powered study planning platform built with Node.js, MongoDB, and Claude AI.

![Tech Stack](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7+-brightgreen) ![Claude AI](https://img.shields.io/badge/Claude-AI%20Powered-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Study Plan Generator | Personalized timetables, daily tasks, revision plans |
| ✅ Smart Task Manager | Create, edit, filter, prioritize tasks |
| ⏱️ Pomodoro Timer | 25/50 min sessions with break tracking |
| 🔔 Alarm System | Browser notifications + audio alerts |
| 📆 Calendar Planner | Monthly view with task overlays |
| 📊 Analytics Dashboard | Study hours, streaks, progress charts |
| 🤖 AI Chatbot | Topic explanations, quizzes, summaries |
| 🃏 Flashcard Generator | AI-generated cards with flip animation |
| ⏳ Exam Countdown | Days/hours until exam |
| 🌙 Dark/Light Mode | System-aware theme toggle |

---

## 🗂️ Project Structure

```
ai-study-planner/
├── frontend/
│   ├── index.html              # Main SPA (all pages)
│   └── assets/
│       ├── css/style.css       # Complete design system
│       └── js/app.js           # Core logic & API calls
├── backend/
│   ├── server.js               # Express server + MongoDB
│   ├── routes/index.js         # All API routes
│   ├── controllers/
│   │   ├── authController.js   # Register, login, JWT
│   │   ├── taskController.js   # CRUD + filtering
│   │   ├── aiController.js     # Claude AI integration
│   │   └── analyticsController.js  # Sessions, alarms, stats
│   ├── models/
│   │   ├── User.js             # User schema + bcrypt
│   │   ├── Task.js             # Task schema
│   │   ├── StudyPlan.js        # AI-generated plans
│   │   └── Session.js          # Pomodoro sessions + alarms + flashcards
│   └── middleware/
│       └── auth.js             # JWT protection
├── .env.example                # Environment template
├── package.json
└── README.md
```

---

## 🛢️ MongoDB Schema

### Users
```js
{ name, email, password(hashed), preferences: { theme, pomodoroWork, dailyGoal }, stats: { totalHoursStudied, streak, tasksCompleted } }
```

### Tasks
```js
{ user, title, description, subject, priority(low/medium/high/urgent), status, tags[], dueDate, estimatedMinutes }
```

### StudyPlans
```js
{ user, title, subjects[], examDate, dailyAvailableHours, plan[{ date, sessions[] }], learningStrategies[] }
```

### Sessions (Pomodoro)
```js
{ user, type, plannedMinutes, actualMinutes, subject, mood, productivityScore, completed }
```

### Flashcards
```js
{ user, subject, topic, cards[{ front, back, difficulty }], aiGenerated }
```

### Alarms
```js
{ user, title, time, repeat, subject, isActive }
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB** — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://cloud.mongodb.com) (free)
- **Anthropic API Key** — [Get one here](https://console.anthropic.com) (optional for demo mode)

---

### Step 1: Setup

```bash
# Navigate to project
cd ai-study-planner

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-study-planner
JWT_SECRET=your-super-secret-key-change-this
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> **Note:** The app works without an API key in demo mode with mock AI responses. Add your Anthropic key for real AI features.

### Step 3: Start MongoDB

**Local:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Cloud (Atlas):** Update `MONGO_URI` to your connection string.

### Step 4: Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:5000** 🎉

---

## 🔑 API Endpoints

### Authentication
```
POST /api/auth/register   — Create account
POST /api/auth/login      — Login + get JWT
GET  /api/auth/me         — Get current user
PUT  /api/auth/preferences — Update settings
```

### Tasks
```
GET    /api/tasks           — Get all tasks (filter: ?status=&priority=&search=)
POST   /api/tasks           — Create task
PUT    /api/tasks/:id       — Update task
DELETE /api/tasks/:id       — Delete task
GET    /api/tasks/stats     — Task statistics
```

### AI
```
POST /api/ai/generate-study-plan  — AI study plan
POST /api/ai/chat                 — Chatbot conversation
POST /api/ai/flashcards           — Generate flashcards
GET  /api/ai/flashcards           — List flashcard sets
POST /api/ai/summarize            — Summarize text
GET  /api/ai/motivation           — Daily motivation
```

### Analytics & Sessions
```
GET  /api/analytics           — Full analytics data
POST /api/sessions            — Log study session
PUT  /api/sessions/:id/complete — Complete session
```

### Alarms
```
POST   /api/alarms      — Set alarm
GET    /api/alarms      — Get active alarms
DELETE /api/alarms/:id  — Delete alarm
```

---

## 🎨 UI Features

- **Dark/Light mode** with CSS variables
- **Glassmorphism** cards and overlays
- **Smooth animations** on all interactions
- **Mobile responsive** sidebar
- **Keyboard shortcuts** (1-5, Ctrl+N, Esc)
- **Toast notifications** system
- **Progress rings** on timer
- **Animated flashcards** with 3D flip
- **Real-time alarm** with audio

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Dashboard |
| `2` | Tasks |
| `3` | Timer |
| `4` | Calendar |
| `5` | AI Chat |
| `Ctrl+N` | New task |
| `Esc` | Close modal |

---

## 🔧 Customization

**Change Timer Defaults:**
Edit `TIMER_MODES` in `app.js`:
```js
const TIMER_MODES = { pomodoro: 25*60, 'short-break': 5*60, 'long-break': 15*60 };
```

**Change Color Theme:**
Edit CSS variables in `style.css`:
```css
:root {
  --accent: #4f8ef7;    /* Primary color */
  --green: #22d3a0;     /* Success color */
}
```

**Switch AI Model:**
Edit `aiController.js`:
```js
model: 'claude-opus-4-5',  // Change to any available model
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB won't connect | Check if mongod is running: `mongod --version` |
| Port in use | Change PORT in `.env` |
| AI not working | Check ANTHROPIC_API_KEY in `.env` |
| Notifications blocked | Click "Allow" in browser notification prompt |

---

## 📄 License

MIT — Free for personal and commercial use.

---

Built with ❤️ using Node.js, MongoDB, Express, and Claude AI.
