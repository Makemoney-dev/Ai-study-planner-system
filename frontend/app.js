/* ═══════════════════════════════════════
   AI STUDY PLANNER — CORE JS
   ═══════════════════════════════════════ */

const API_BASE = '/api';

/* ─── STATE ─── */
const AppState = {
  user: null,
  token: null,
  tasks: [],
  currentPage: 'dashboard',
  timer: {
    interval: null,
    seconds: 25 * 60,
    running: false,
    mode: 'pomodoro',
    session: null
  },
  alarms: [],
  alarmCheckerInterval: null,
  chatHistory: [],
  currentFlashcards: [],
  flashcardIndex: 0,
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  }
};

/* ─── API HELPER ─── */
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(AppState.token ? { Authorization: `Bearer ${AppState.token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

/* ─── AUTH ─── */
async function login(email, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  setUser(data.token, data.user);
  return data;
}

async function register(name, email, password) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });
  setUser(data.token, data.user);
  return data;
}

function setUser(token, user) {
  AppState.token = token;
  AppState.user = user;
  localStorage.setItem('sp_token', token);
  localStorage.setItem('sp_user', JSON.stringify(user));
}

function logout() {
  AppState.token = null;
  AppState.user = null;
  AppState.chatHistory = [];
  localStorage.removeItem('sp_token');
  localStorage.removeItem('sp_user');
  if (AppState.alarmCheckerInterval) clearInterval(AppState.alarmCheckerInterval);
  window.location.reload();
}

function checkAuth() {
  const token = localStorage.getItem('sp_token');
  const userStr = localStorage.getItem('sp_user');
  if (token && userStr) {
    try {
      AppState.token = token;
      AppState.user = JSON.parse(userStr);
      return true;
    } catch(e) {}
  }
  return false;
}

/* ─── TOAST ─── */
function toast(message, type = 'info', duration = 4000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ─── LOADING ─── */
function showLoading(text = 'Processing...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner" style="width:40px;height:40px;border-width:3px"></div><div class="loading-text">${text}</div>`;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector('.loading-text').textContent = text;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ─── MODAL ─── */
function showModal(id) {
  document.getElementById(id)?.classList.add('active');
}
function hideModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

/* ─── NAVIGATION ─── */
function navigateTo(page) {
  AppState.currentPage = page;
  
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Show/hide sections
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  // Update topbar title
  const titles = {
    dashboard: '🏠 Dashboard',
    tasks: '✅ Task Manager',
    planner: '📅 AI Study Planner',
    timer: '⏱️ Focus Timer',
    calendar: '📆 Calendar',
    chat: '🤖 AI Assistant',
    flashcards: '🃏 Flashcards',
    analytics: '📊 Analytics',
    settings: '⚙️ Settings'
  };

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[page] || page;

  // Page-specific init
  if (page === 'dashboard') loadDashboard();
  if (page === 'tasks') loadTasks();
  if (page === 'analytics') loadAnalytics();
  if (page === 'calendar') renderCalendar();
  if (page === 'flashcards') loadFlashcardSets();

  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
}

/* ─── TASKS ─── */
async function loadTasks() {
  try {
    const data = await api('/tasks?sort=-createdAt');
    AppState.tasks = data.tasks;
    renderTasks(data.tasks);
  } catch(e) {
    toast('Failed to load tasks', 'error');
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  if (!container) return;

  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">✅</span><h3>No tasks yet</h3><p>Create your first task to get started!</p></div>`;
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" id="task-${task._id}">
      <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="toggleTask('${task._id}', '${task.status}')">
        ${task.status === 'completed' ? '✓' : ''}
      </div>
      <div class="task-content">
        <div class="task-title ${task.status === 'completed' ? 'completed-text' : ''}">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="badge badge-${task.priority}">${task.priority}</span>
          ${task.subject ? `<span class="badge badge-subject">${escapeHtml(task.subject)}</span>` : ''}
          ${task.dueDate ? `<span class="text-xs text-muted">📅 ${formatDate(task.dueDate)}</span>` : ''}
          ${task.tags?.slice(0,2).map(t => `<span class="badge badge-tag">#${t}</span>`).join('') || ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editTask('${task._id}')" title="Edit">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteTask('${task._id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function toggleTask(id, currentStatus) {
  try {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await api(`/tasks/${id}`, { method: 'PUT', body: { status: newStatus } });
    await loadTasks();
    if (newStatus === 'completed') toast('Task completed! 🎉', 'success');
  } catch(e) {
    toast('Failed to update task', 'error');
  }
}

async function createTask(formData) {
  try {
    await api('/tasks', { method: 'POST', body: formData });
    hideModal('task-modal');
    await loadTasks();
    toast('Task created!', 'success');
  } catch(e) {
    toast('Failed to create task: ' + e.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
    toast('Task deleted', 'info');
  } catch(e) {
    toast('Failed to delete', 'error');
  }
}

function editTask(id) {
  const task = AppState.tasks.find(t => t._id === id);
  if (!task) return;
  
  document.getElementById('task-form-title').value = task.title;
  document.getElementById('task-form-desc').value = task.description || '';
  document.getElementById('task-form-subject').value = task.subject || '';
  document.getElementById('task-form-priority').value = task.priority;
  document.getElementById('task-form-due').value = task.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-form').dataset.editId = id;
  showModal('task-modal');
}

/* ─── POMODORO TIMER ─── */
const TIMER_MODES = { pomodoro: 25*60, 'short-break': 5*60, 'long-break': 15*60 };

function setTimerMode(mode) {
  if (AppState.timer.running) stopTimer();
  AppState.timer.mode = mode;
  AppState.timer.seconds = TIMER_MODES[mode];
  updateTimerDisplay();
  updateTimerModeUI(mode);
}

function updateTimerModeUI(mode) {
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function startTimer() {
  if (AppState.timer.running) return;
  AppState.timer.running = true;
  
  document.getElementById('timer-start-btn')?.style && (document.getElementById('timer-start-btn').style.display = 'none');
  document.getElementById('timer-pause-btn')?.style && (document.getElementById('timer-pause-btn').style.display = 'inline-flex');

  AppState.timer.interval = setInterval(() => {
    AppState.timer.seconds--;
    updateTimerDisplay();
    if (AppState.timer.seconds <= 0) {
      timerComplete();
    }
  }, 1000);

  // Create session in DB
  const subject = document.getElementById('timer-subject')?.value;
  api('/sessions', {
    method: 'POST',
    body: {
      type: AppState.timer.mode,
      plannedMinutes: Math.floor(TIMER_MODES[AppState.timer.mode] / 60),
      subject: subject || 'General'
    }
  }).then(data => {
    AppState.timer.session = data.session;
  }).catch(() => {});
}

function pauseTimer() {
  clearInterval(AppState.timer.interval);
  AppState.timer.running = false;
  document.getElementById('timer-start-btn')?.style && (document.getElementById('timer-start-btn').style.display = 'inline-flex');
  document.getElementById('timer-pause-btn')?.style && (document.getElementById('timer-pause-btn').style.display = 'none');
}

function stopTimer() {
  pauseTimer();
  AppState.timer.seconds = TIMER_MODES[AppState.timer.mode];
  updateTimerDisplay();
}

function timerComplete() {
  pauseTimer();
  playAlarmSound();
  toast(`🎉 ${AppState.timer.mode === 'pomodoro' ? 'Focus session' : 'Break'} complete!`, 'success', 6000);
  
  // Show notification
  if (Notification.permission === 'granted') {
    new Notification('AI Study Planner', {
      body: AppState.timer.mode === 'pomodoro' ? '✅ Focus session complete! Time for a break.' : '⚡ Break over! Ready to focus?',
      icon: '/favicon.ico'
    });
  }

  // Complete session in DB
  if (AppState.timer.session) {
    const plannedMins = Math.floor(TIMER_MODES[AppState.timer.mode] / 60);
    api(`/sessions/${AppState.timer.session._id}/complete`, {
      method: 'PUT',
      body: { actualMinutes: plannedMins, mood: 'good', productivityScore: 8 }
    }).catch(() => {});
  }

  // Auto switch mode
  if (AppState.timer.mode === 'pomodoro') {
    setTimerMode('short-break');
  } else {
    setTimerMode('pomodoro');
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(AppState.timer.seconds / 60);
  const secs = AppState.timer.seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const timeEl = document.getElementById('timer-time');
  if (timeEl) timeEl.textContent = display;
  
  // Update progress ring
  const total = TIMER_MODES[AppState.timer.mode];
  const progress = ((total - AppState.timer.seconds) / total) * 100;
  updateTimerRing(progress);
}

function updateTimerRing(progress) {
  const circle = document.getElementById('timer-progress-circle');
  if (!circle) return;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (progress / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

/* ─── AI CHAT ─── */
async function sendChatMessage(message) {
  if (!message.trim()) return;
  
  // Add user message
  addChatMessage(message, 'user');
  AppState.chatHistory.push({ role: 'user', content: message });
  
  // Show typing indicator
  const typingId = addTypingIndicator();
  
  try {
    const data = await api('/ai/chat', {
      method: 'POST',
      body: {
        message,
        conversationHistory: AppState.chatHistory.slice(-10)
      }
    });
    
    removeTypingIndicator(typingId);
    addChatMessage(data.response, 'ai');
    AppState.chatHistory.push({ role: 'assistant', content: data.response });
    
  } catch(e) {
    removeTypingIndicator(typingId);
    addChatMessage('Sorry, I encountered an error. Please check your API key configuration.', 'ai');
  }
}

function addChatMessage(text, role) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const avatarContent = role === 'user' 
    ? (AppState.user?.name?.[0] || 'U').toUpperCase()
    : '🤖';

  const el = document.createElement('div');
  el.className = `chat-message ${role}`;
  el.innerHTML = `
    <div class="chat-avatar">${avatarContent}</div>
    <div class="chat-bubble">${formatMarkdown(text)}</div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const id = 'typing-' + Date.now();
  const container = document.getElementById('chat-messages');
  if (!container) return id;
  const el = document.createElement('div');
  el.id = id;
  el.className = 'chat-message ai';
  el.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble" style="padding:14px 18px"><span class="spinner"></span></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

/* ─── STUDY PLAN GENERATOR ─── */
async function generateStudyPlan(formData) {
  showLoading('🤖 AI is generating your personalized study plan...');
  try {
    const data = await api('/ai/generate-study-plan', {
      method: 'POST',
      body: formData
    });
    hideLoading();
    renderStudyPlan(data);
    toast('Study plan generated!', 'success');
  } catch(e) {
    hideLoading();
    toast('Failed to generate plan: ' + e.message, 'error');
  }
}

function renderStudyPlan(data) {
  const container = document.getElementById('study-plan-result');
  if (!container) return;
  
  const plan = data.plan;
  const days = data.daysUntilExam;
  
  container.innerHTML = `
    <div class="card mb-24">
      <div class="card-title">📋 ${escapeHtml(plan.planTitle || 'Your Study Plan')}</div>
      <p class="text-secondary mb-16">${escapeHtml(plan.overview || '')}</p>
      <div class="countdown-grid mb-16">
        <div class="countdown-unit">
          <div class="countdown-num">${days}</div>
          <div class="countdown-unit-label">Days Left</div>
        </div>
        <div class="countdown-unit">
          <div class="countdown-num">${plan.weeklyPlan?.length || 1}</div>
          <div class="countdown-unit-label">Weeks</div>
        </div>
      </div>
    </div>

    ${plan.learningStrategies?.length ? `
    <div class="card mb-24">
      <div class="card-title">🧠 Learning Strategies</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;">
        ${plan.learningStrategies.map(s => `
          <li style="display:flex;align-items:flex-start;gap:8px;">
            <span style="color:var(--green);margin-top:2px;">✓</span>
            <span class="text-secondary">${escapeHtml(s)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${plan.weeklyPlan?.map((week, wi) => `
      <div class="card mb-16">
        <div class="card-title">📅 Week ${week.week}: ${escapeHtml(week.theme || '')}</div>
        <div style="display:grid;gap:10px;">
          ${Object.entries(week.dailyBreakdown || {}).map(([day, sessions]) => `
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;">
              <div style="font-weight:600;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${day}</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${sessions.map(s => `
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${s.type==='break'?'var(--green)':s.type==='revision'?'var(--yellow)':'var(--accent)'};flex-shrink:0;"></span>
                    <span class="text-sm">${escapeHtml(s.subject || '')} ${s.topic ? `— ${escapeHtml(s.topic)}` : escapeHtml(s.activity || '')}</span>
                    ${s.duration ? `<span class="text-xs text-muted" style="margin-left:auto;">${s.duration}min</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('') || ''}

    ${plan.motivationalTip ? `
    <div class="card" style="border-color:var(--accent);background:var(--accent-dim);">
      <div class="card-title text-accent">💡 Motivational Tip</div>
      <p class="text-secondary">${escapeHtml(plan.motivationalTip)}</p>
    </div>
    ` : ''}
  `;
}

/* ─── FLASHCARDS ─── */
async function generateFlashcards(topic, subject, count) {
  showLoading('🃏 Generating flashcards...');
  try {
    const data = await api('/ai/flashcards', {
      method: 'POST',
      body: { topic, subject, count: parseInt(count) || 10 }
    });
    hideLoading();
    AppState.currentFlashcards = data.flashcards.cards;
    AppState.flashcardIndex = 0;
    renderFlashcard();
    document.getElementById('flashcard-count').textContent = `1 / ${AppState.currentFlashcards.length}`;
    document.getElementById('flashcard-viewer').style.display = 'block';
    toast(`${AppState.currentFlashcards.length} flashcards created!`, 'success');
  } catch(e) {
    hideLoading();
    toast('Failed to generate flashcards: ' + e.message, 'error');
  }
}

async function loadFlashcardSets() {
  try {
    const data = await api('/ai/flashcards');
    renderFlashcardSets(data.flashcards);
  } catch(e) {}
}

function renderFlashcardSets(sets) {
  const container = document.getElementById('flashcard-sets');
  if (!container) return;
  if (!sets.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🃏</span><h3>No flashcards yet</h3><p>Generate your first set above!</p></div>`;
    return;
  }
  container.innerHTML = sets.map(set => `
    <div class="card card-hover pointer" onclick="loadFlashcardSet(${JSON.stringify(set.cards).replace(/"/g, '&quot;')}, '${escapeHtml(set.topic)}')">
      <div class="flex-between mb-8">
        <span class="badge badge-subject">${escapeHtml(set.subject)}</span>
        <span class="text-xs text-muted">${set.cards.length} cards</span>
      </div>
      <div class="card-title" style="margin-bottom:4px;">${escapeHtml(set.topic)}</div>
      <p class="text-sm text-muted">${formatDate(set.createdAt)}</p>
    </div>
  `).join('');
}

function loadFlashcardSet(cards, topic) {
  AppState.currentFlashcards = cards;
  AppState.flashcardIndex = 0;
  renderFlashcard();
  document.getElementById('flashcard-count').textContent = `1 / ${cards.length}`;
  document.getElementById('flashcard-viewer').style.display = 'block';
  document.getElementById('fc-topic').value = topic;
}

function renderFlashcard() {
  const card = AppState.currentFlashcards[AppState.flashcardIndex];
  if (!card) return;
  
  const front = document.getElementById('fc-front-text');
  const back = document.getElementById('fc-back-text');
  const cardEl = document.getElementById('flashcard-inner');
  
  if (front) front.textContent = card.front;
  if (back) back.textContent = card.back;
  if (cardEl) cardEl.classList.remove('flipped');
}

function flipFlashcard() {
  document.getElementById('flashcard-inner')?.classList.toggle('flipped');
}

function nextFlashcard() {
  if (AppState.flashcardIndex < AppState.currentFlashcards.length - 1) {
    AppState.flashcardIndex++;
    renderFlashcard();
    document.getElementById('flashcard-count').textContent = `${AppState.flashcardIndex + 1} / ${AppState.currentFlashcards.length}`;
  }
}

function prevFlashcard() {
  if (AppState.flashcardIndex > 0) {
    AppState.flashcardIndex--;
    renderFlashcard();
    document.getElementById('flashcard-count').textContent = `${AppState.flashcardIndex + 1} / ${AppState.currentFlashcards.length}`;
  }
}

/* ─── ALARM SYSTEM ─── */
async function loadAlarms() {
  try {
    const data = await api('/alarms');
    AppState.alarms = data.alarms;
    renderAlarms(data.alarms);
  } catch(e) {}
}

function renderAlarms(alarms) {
  const container = document.getElementById('alarms-list');
  if (!container) return;
  
  if (!alarms.length) {
    container.innerHTML = `<p class="text-muted text-sm">No alarms set. Add one above.</p>`;
    return;
  }
  
  container.innerHTML = alarms.map(alarm => `
    <div class="flex-between" style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-md);margin-bottom:8px;">
      <div>
        <div class="text-sm font-bold">🔔 ${escapeHtml(alarm.title)}</div>
        <div class="text-xs text-muted">${formatDateTime(alarm.time)} · ${alarm.repeat}</div>
      </div>
      <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAlarm('${alarm._id}')">✕</button>
    </div>
  `).join('');
}

async function setAlarm(title, time, subject, repeat) {
  try {
    await api('/alarms', {
      method: 'POST',
      body: { title, time, subject, repeat }
    });
    await loadAlarms();
    toast('Alarm set! 🔔', 'success');
    requestNotificationPermission();
  } catch(e) {
    toast('Failed to set alarm', 'error');
  }
}

async function deleteAlarm(id) {
  try {
    await api(`/alarms/${id}`, { method: 'DELETE' });
    await loadAlarms();
  } catch(e) {}
}

function startAlarmChecker() {
  if (AppState.alarmCheckerInterval) clearInterval(AppState.alarmCheckerInterval);
  AppState.alarmCheckerInterval = setInterval(async () => {
    const now = new Date();
    AppState.alarms.forEach(alarm => {
      const alarmTime = new Date(alarm.time);
      const diff = Math.abs(now - alarmTime);
      if (diff < 30000 && !alarm._triggered) {
        alarm._triggered = true;
        triggerAlarm(alarm);
      }
    });
  }, 15000);
}

function triggerAlarm(alarm) {
  playAlarmSound();
  
  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification(`⏰ ${alarm.title}`, {
      body: alarm.subject ? `Subject: ${alarm.subject}` : 'Time to study!',
    });
  }
  
  // On-screen popup
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;backdrop-filter:blur(4px);';
  const popup = document.createElement('div');
  popup.className = 'alarm-notification';
  popup.innerHTML = `
    <div class="alarm-icon">⏰</div>
    <h2 style="font-family:var(--font-display);font-size:22px;margin-bottom:8px;">${escapeHtml(alarm.title)}</h2>
    <p class="text-secondary mb-16">${alarm.subject ? `Time to study: ${escapeHtml(alarm.subject)}` : 'Your study alarm!'}</p>
    <button class="btn btn-primary" onclick="this.closest('.alarm-notification').remove();document.querySelector('[data-alarm-overlay]').remove();">
      ✓ Dismiss
    </button>
  `;
  overlay.dataset.alarmOverlay = '1';
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  setTimeout(() => { overlay.remove(); popup.remove(); }, 30000);
}

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/* ─── CALENDAR ─── */
function renderCalendar() {
  const { year, month } = AppState.calendar;
  const container = document.getElementById('calendar-grid');
  const title = document.getElementById('calendar-title');
  if (!container) return;

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (title) title.textContent = `${months[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  let html = days.map(d => `<div class="cal-header">${d}</div>`).join('');

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-num">${daysInPrevMonth - i}</div></div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayTasks = AppState.tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate.startsWith(dateStr);
    });
    
    html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="calDayClick('${dateStr}')">
      <div class="cal-num">${d}</div>
      ${dayTasks.slice(0,2).map(t => `<div class="cal-event">${escapeHtml(t.title)}</div>`).join('')}
      ${dayTasks.length > 2 ? `<div class="cal-event">+${dayTasks.length - 2} more</div>` : ''}
    </div>`;
  }

  container.innerHTML = html;
}

function calDayClick(dateStr) {
  const dayTasks = AppState.tasks.filter(t => t.dueDate?.startsWith(dateStr));
  if (dayTasks.length) {
    toast(`${dayTasks.length} task(s) due on ${dateStr}`, 'info');
  }
}

/* ─── ANALYTICS ─── */
async function loadAnalytics() {
  try {
    const data = await api('/analytics');
    renderAnalytics(data.analytics);
  } catch(e) {
    console.error('Analytics error:', e);
  }
}

function renderAnalytics(analytics) {
  // Update stat cards
  setEl('analytics-total-hours', Math.round(analytics.totalHoursStudied * 10) / 10);
  setEl('analytics-tasks-completed', analytics.totalTasksCompleted);
  setEl('analytics-streak', analytics.currentStreak);
  setEl('analytics-weekly-hours', analytics.weeklyHours);

  // Daily chart
  const chartEl = document.getElementById('daily-chart');
  if (chartEl && analytics.dailyData) {
    const maxMins = Math.max(...analytics.dailyData.map(d => d.minutes), 60);
    chartEl.innerHTML = analytics.dailyData.map(d => {
      const pct = Math.max((d.minutes / maxMins) * 100, 2);
      const label = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
      const hrs = (d.minutes / 60).toFixed(1);
      return `
        <div class="chart-bar-wrap" title="${hrs} hours on ${d.date}">
          <div class="chart-bar" style="height:${pct}%;" ></div>
          <div class="chart-bar-label">${label}</div>
        </div>
      `;
    }).join('');
  }

  // Task breakdown
  const tasksEl = document.getElementById('tasks-breakdown');
  if (tasksEl && analytics.tasks) {
    const t = analytics.tasks;
    const total = Object.values(t).reduce((a, b) => a + b, 0) || 1;
    tasksEl.innerHTML = [
      { label: 'Completed', value: t.completed, color: 'var(--green)' },
      { label: 'In Progress', value: t['in-progress'], color: 'var(--accent)' },
      { label: 'Pending', value: t.pending, color: 'var(--yellow)' },
      { label: 'Cancelled', value: t.cancelled, color: 'var(--text-muted)' }
    ].map(item => `
      <div class="mb-8">
        <div class="flex-between mb-4">
          <span class="text-sm">${item.label}</span>
          <span class="text-sm text-muted">${item.value}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(item.value/total)*100}%;background:${item.color};"></div>
        </div>
      </div>
    `).join('');
  }

  // Subject breakdown
  const subjectEl = document.getElementById('subject-breakdown');
  if (subjectEl && analytics.subjectBreakdown?.length) {
    const maxMins = Math.max(...analytics.subjectBreakdown.map(s => s.totalMinutes), 1);
    subjectEl.innerHTML = analytics.subjectBreakdown.map(s => `
      <div class="mb-8">
        <div class="flex-between mb-4">
          <span class="text-sm">${s._id || 'General'}</span>
          <span class="text-sm text-muted">${(s.totalMinutes/60).toFixed(1)}h</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(s.totalMinutes/maxMins)*100}%;"></div>
        </div>
      </div>
    `).join('');
  }
}

/* ─── DASHBOARD ─── */
async function loadDashboard() {
  try {
    // Load motivation
    const motivationEl = document.getElementById('motivation-text');
    if (motivationEl) {
      api('/ai/motivation').then(data => {
        motivationEl.textContent = data.message;
      }).catch(() => {
        motivationEl.textContent = `Welcome back, ${AppState.user?.name}! Ready to crush your goals today? 🚀`;
      });
    }

    // Load recent tasks
    const data = await api('/tasks?sort=-createdAt&status=pending');
    const container = document.getElementById('recent-tasks');
    if (container) {
      const tasks = data.tasks.slice(0, 5);
      if (!tasks.length) {
        container.innerHTML = `<div class="empty-state" style="padding:24px;"><span class="empty-icon">✅</span><p>No pending tasks. Add some!</p></div>`;
      } else {
        container.innerHTML = tasks.map(task => `
          <div class="task-item" onclick="navigateTo('tasks')">
            <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="event.stopPropagation();toggleTask('${task._id}', '${task.status}')">
              ${task.status === 'completed' ? '✓' : ''}
            </div>
            <div class="task-content">
              <div class="task-title">${escapeHtml(task.title)}</div>
              <div class="task-meta">
                <span class="badge badge-${task.priority}">${task.priority}</span>
                ${task.subject ? `<span class="badge badge-subject">${escapeHtml(task.subject)}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // User stats
    const user = AppState.user;
    if (user?.stats) {
      setEl('dash-hours', Math.round(user.stats.totalHoursStudied * 10) / 10);
      setEl('dash-tasks', user.stats.totalTasksCompleted);
      setEl('dash-streak', user.stats.currentStreak);
    }

    // Exam countdown
    updateExamCountdown();

  } catch(e) {
    console.error('Dashboard error:', e);
  }
}

function updateExamCountdown() {
  const examDate = localStorage.getItem('sp_exam_date');
  const examName = localStorage.getItem('sp_exam_name') || 'Upcoming Exam';
  const countdownEl = document.getElementById('exam-countdown');
  
  if (!countdownEl) return;
  
  if (!examDate) {
    countdownEl.innerHTML = `<p class="text-muted text-sm">No exam set. <button class="btn btn-ghost btn-sm" onclick="document.getElementById('exam-date-input')?.focus()">Set exam date →</button></p>`;
    return;
  }

  const now = new Date();
  const exam = new Date(examDate);
  const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    countdownEl.innerHTML = `<p class="text-green">🎉 ${examName} has passed!</p>`;
    return;
  }

  const days = diff;
  const hours = Math.floor((exam - now) / (1000 * 60 * 60)) % 24;
  
  countdownEl.innerHTML = `
    <p class="text-xs text-muted mb-8" style="text-align:center;">${escapeHtml(examName)}</p>
    <div class="countdown-grid">
      <div class="countdown-unit"><div class="countdown-num">${days}</div><div class="countdown-unit-label">Days</div></div>
      <div class="countdown-unit"><div class="countdown-num">${hours}</div><div class="countdown-unit-label">Hours</div></div>
    </div>
  `;
}

/* ─── HELPERS ─── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/* ─── THEME ─── */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sp_theme', next);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
}

function loadTheme() {
  const saved = localStorage.getItem('sp_theme') || 
    (AppState.user?.preferences?.theme || 'dark');
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = saved === 'light' ? '🌙' : '☀️';
}

/* ─── KEYBOARD SHORTCUTS ─── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      showModal('task-modal');
    }
    if (e.key === '1') navigateTo('dashboard');
    if (e.key === '2') navigateTo('tasks');
    if (e.key === '3') navigateTo('timer');
    if (e.key === '4') navigateTo('calendar');
    if (e.key === '5') navigateTo('chat');
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}
