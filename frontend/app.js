/* ═══════════════════════════════════════════════════════
   AI STUDY PLANNER — CYBER QUANTUM CORE ENGINE
   ═══════════════════════════════════════════════════════ */

const API_BASE = '/api';

/* ─── GLOBAL APPLICATION STATE ─── */
const AppState = {
  user: {
    name: 'Explorer',
    email: 'explorer@synapse.ai',
    stats: { totalHoursStudied: 0, totalTasksCompleted: 0, currentStreak: 1 }
  },
  token: localStorage.getItem('sp_token') || 'default_guest_token',
  tasks: [],
  currentPage: 'dashboard',
  timer: {
    interval: null,
    seconds: 25 * 60,
    running: false,
    mode: 'pomodoro',
    session: null
  },
  soundscape: {
    active: false,
    type: 'alpha',
    audioCtx: null,
    nodes: [],
    gainNode: null,
    volume: 0.35
  },
  sfxMuted: false,
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

/* ═══════════════════════════════════════════════════════
   CYBER SYNTHESIZER: NATIVE WEB AUDIO SFX & SOUNDSCAPES
   ═══════════════════════════════════════════════════════ */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Futuristic UI Micro-Interactions
  play(type = 'click') {
    if (AppState.sfxMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'hover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'success') {
        // Futuristic dual chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          const t = now + i * 0.07;
          g.gain.setValueAtTime(0.08, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          o.start(t);
          o.stop(t + 0.35);
        });
      } else if (type === 'timerTick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      } else if (type === 'alarm') {
        // Dual alternating warble
        [880, 660, 880, 1100].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          const t = now + i * 0.12;
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          o.start(t);
          o.stop(t + 0.14);
        });
      }
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  }

  // Deep Focus Ambient Soundscapes Synthesizer
  toggleSoundscape(type) {
    if (AppState.soundscape.active && AppState.soundscape.type === type) {
      this.stopSoundscape();
      return false;
    }
    this.stopSoundscape();
    this.startSoundscape(type);
    return true;
  }

  startSoundscape(type) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      AppState.soundscape.type = type;
      AppState.soundscape.active = true;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(AppState.soundscape.volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      AppState.soundscape.gainNode = masterGain;
      AppState.soundscape.nodes = [];

      if (type === 'alpha') {
        // 432Hz Pure Quantum Alpha Waves with 10Hz binaural differential
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.value = 432;
        oscR.frequency.value = 442; // 10Hz Alpha differential

        const merger = ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(masterGain);

        oscL.start();
        oscR.start();
        AppState.soundscape.nodes.push(oscL, oscR);
      } else if (type === 'rain') {
        // Cyber Rain: Filtered Pink Noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 850;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        AppState.soundscape.nodes.push(whiteNoise);
      } else if (type === 'drone') {
        // Cosmic Atmospheric Drone
        [108, 162, 216].forEach(freq => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.25;
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start();
          AppState.soundscape.nodes.push(osc);
        });
      } else if (type === 'gamma') {
        // 40Hz Gamma Focus (High Concentration)
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.value = 200;
        oscR.frequency.value = 240; // 40Hz Gamma differential

        const merger = ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(masterGain);

        oscL.start();
        oscR.start();
        AppState.soundscape.nodes.push(oscL, oscR);
      }

      updateSoundscapeUI(true, type);
    } catch (e) {
      console.warn('Soundscape startup error:', e);
    }
  }

  stopSoundscape() {
    AppState.soundscape.nodes.forEach(node => {
      try { node.stop(); node.disconnect(); } catch (e) {}
    });
    AppState.soundscape.nodes = [];
    AppState.soundscape.active = false;
    updateSoundscapeUI(false);
  }

  setVolume(vol) {
    AppState.soundscape.volume = vol;
    if (AppState.soundscape.gainNode) {
      AppState.soundscape.gainNode.gain.setValueAtTime(vol, this.getContext().currentTime);
    }
  }
}

const CyberAudio = new CyberAudioEngine();

function updateSoundscapeUI(isActive, type = '') {
  const eq = document.getElementById('soundscape-eq');
  const playBtn = document.getElementById('soundscape-toggle-btn');
  const label = document.getElementById('soundscape-status-text');

  if (eq) {
    if (isActive) eq.classList.remove('paused');
    else eq.classList.add('paused');
  }
  if (playBtn) {
    playBtn.textContent = isActive ? '⏸ Stop Audio' : '▶ Play Focus Audio';
    playBtn.classList.toggle('btn-primary', isActive);
    playBtn.classList.toggle('btn-secondary', !isActive);
  }
  if (label) {
    const titles = {
      alpha: '🧠 432Hz Quantum Alpha Waves',
      rain: '🌧️ Cyber Rain Soundscape',
      drone: '🌌 Cosmic Deep Drone',
      gamma: '⚡ 40Hz Gamma Hyper-Focus'
    };
    label.textContent = isActive ? titles[type] || 'Synthesized Ambient Active' : 'Soundscape Inactive';
  }
}

function toggleSFXMute() {
  AppState.sfxMuted = !AppState.sfxMuted;
  localStorage.setItem('sp_sfx_muted', AppState.sfxMuted);
  const btn = document.getElementById('sfx-toggle');
  if (btn) {
    btn.innerHTML = AppState.sfxMuted ? '🔇' : '🔊';
    btn.title = AppState.sfxMuted ? 'Unmute Cyber SFX' : 'Mute Cyber SFX';
  }
  if (!AppState.sfxMuted) CyberAudio.play('click');
}

/* ═══════════════════════════════════════════════════════
   CYBER MATRIX & CONSTELLATION CANVAS ENGINE
   ═══════════════════════════════════════════════════════ */
function initCyberCanvas() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const mouse = { x: -1000, y: -1000, radius: 120 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 14000), 75);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  resize();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Render particles & connecting cyber synapses
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse gentle repulsion/attraction
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        p.x -= (dx / dist) * force * 1.5;
        p.y -= (dy / dist) * force * 1.5;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const pDist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (pDist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - pDist / 110) * 0.15})`;
          ctx.lineWidth = 0.75;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ═══════════════════════════════════════════════════════
   API COMMUNICATION HELPER
   ═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   SESSION INITIALIZATION (DIRECT ACCESS - NO LOGIN REQUIRED)
   ═══════════════════════════════════════════════════════ */
async function ensureSession() {
  const token = localStorage.getItem('sp_token');
  const userStr = localStorage.getItem('sp_user');

  if (token && userStr) {
    try {
      AppState.token = token;
      AppState.user = JSON.parse(userStr);
      return;
    } catch (e) {}
  }

  try {
    const data = await api('/auth/default-token');
    if (data && data.token) {
      setUser(data.token, data.user);
      return;
    }
  } catch (err) {}

  const defaultUser = {
    name: 'Explorer',
    email: 'explorer@synapse.ai',
    stats: { totalHoursStudied: 0, totalTasksCompleted: 0, currentStreak: 1 }
  };
  setUser('default_guest_token', defaultUser);
}

function setUser(token, user) {
  AppState.token = token;
  AppState.user = user || {
    name: 'Explorer',
    email: 'explorer@synapse.ai',
    stats: { totalHoursStudied: 0, totalTasksCompleted: 0, currentStreak: 1 }
  };
  localStorage.setItem('sp_token', AppState.token);
  localStorage.setItem('sp_user', JSON.stringify(AppState.user));
}

function checkAuth() {
  return true;
}

function logout() {
  // Silent reset
  localStorage.removeItem('sp_token');
  localStorage.removeItem('sp_user');
  window.location.reload();
}

/* ═══════════════════════════════════════════════════════
   CYBER HUD TOAST & FEEDBACK
   ═══════════════════════════════════════════════════════ */
function toast(message, type = 'info', duration = 3800) {
  const icons = { success: '⚡', error: '⚠️', warning: '⚡', info: '🛰️' };
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '✨'}</span><span>${message}</span>`;
  container.appendChild(el);

  if (type === 'success') CyberAudio.play('success');
  else CyberAudio.play('click');

  setTimeout(() => {
    el.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function showLoading(text = 'Neural processing...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner" style="width:48px;height:48px;border-width:3px"></div><div class="loading-text">${text}</div>`;
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

/* ═══════════════════════════════════════════════════════
   MODAL ENGINE
   ═══════════════════════════════════════════════════════ */
function showModal(id) {
  CyberAudio.play('click');
  document.getElementById(id)?.classList.add('active');
}

function hideModal(id) {
  CyberAudio.play('click');
  document.getElementById(id)?.classList.remove('active');
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION ENGINE
   ═══════════════════════════════════════════════════════ */
function navigateTo(page) {
  CyberAudio.play('click');
  AppState.currentPage = page;

  // Sidebar links
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Mobile Bottom Dock links
  document.querySelectorAll('.dock-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Page sections
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  // Update topbar title
  const titles = {
    dashboard: '🏠 Mission Dashboard',
    tasks: '✅ Task Matrix',
    planner: '📅 AI Quantum Planner',
    timer: '⏱️ Focus Reactor',
    calendar: '📆 Neural Calendar',
    chat: '🤖 AI StudyBot Assistant',
    flashcards: '🃏 Holographic Flashcards',
    summarizer: '⚡ AI Notes Synthesizer',
    analytics: '📊 Quantum Analytics',
    settings: '⚙️ Cyber System Settings'
  };

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[page] || page;

  // Page-specific initialization
  if (page === 'dashboard') loadDashboard();
  if (page === 'tasks') loadTasks();
  if (page === 'analytics') loadAnalytics();
  if (page === 'calendar') renderCalendar();
  if (page === 'flashcards') loadFlashcardSets();

  // Close mobile drawer if opened
  toggleMobileSidebar(false);
}

function toggleMobileSidebar(open) {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  const willOpen = open !== undefined ? open : !sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', willOpen);
  if (backdrop) backdrop.classList.toggle('active', willOpen);
  CyberAudio.play('click');
}

/* ═══════════════════════════════════════════════════════
   TASK MANAGEMENT
   ═══════════════════════════════════════════════════════ */
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
    container.innerHTML = `
      <div class="card flex-center" style="padding:48px;text-align:center;flex-direction:column;gap:12px;">
        <span style="font-size:40px;">🛸</span>
        <h3 class="font-hud" style="font-size:16px;">Task Matrix Clear</h3>
        <p class="text-secondary text-sm">All missions completed. Deploy a new task below.</p>
        <button class="btn btn-primary btn-sm mt-8" onclick="showModal('task-modal')">+ Create Mission Task</button>
      </div>`;
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
          ${task.dueDate ? `<span class="text-xs text-muted font-mono">📅 ${formatDate(task.dueDate)}</span>` : ''}
          ${task.tags?.slice(0, 3).map(t => `<span class="badge badge-tag">#${t}</span>`).join('') || ''}
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
    if (newStatus === 'completed') {
      CyberAudio.play('success');
      toast('Task Completed! +XP Earned ⚡', 'success');
    } else {
      CyberAudio.play('click');
    }
  } catch(e) {
    toast('Failed to update task', 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Abort and delete this task?')) return;
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    CyberAudio.play('click');
    await loadTasks();
    toast('Task removed from matrix', 'info');
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
  document.getElementById('task-modal-title').textContent = 'Modify Mission Task';
  document.getElementById('task-form').dataset.editId = id;
  showModal('task-modal');
}

/* ═══════════════════════════════════════════════════════
   POMODORO FOCUS REACTOR
   ═══════════════════════════════════════════════════════ */
const TIMER_MODES = { pomodoro: 25 * 60, 'short-break': 5 * 60, 'long-break': 15 * 60 };

function setTimerMode(mode) {
  if (AppState.timer.running) stopTimer();
  CyberAudio.play('click');
  AppState.timer.mode = mode;
  AppState.timer.seconds = TIMER_MODES[mode];
  updateTimerDisplay();
  updateTimerModeUI(mode);
}

function updateTimerModeUI(mode) {
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  const label = document.getElementById('timer-mode-label');
  if (label) {
    label.textContent = mode === 'pomodoro' ? 'Hyper-Focus Core' : mode === 'short-break' ? 'Quantum Cooldown' : 'Extended Recharge';
  }
}

function startTimer() {
  if (AppState.timer.running) return;
  AppState.timer.running = true;
  CyberAudio.play('success');

  document.getElementById('timer-start-btn')?.style && (document.getElementById('timer-start-btn').style.display = 'none');
  document.getElementById('timer-pause-btn')?.style && (document.getElementById('timer-pause-btn').style.display = 'inline-flex');

  AppState.timer.interval = setInterval(() => {
    AppState.timer.seconds--;
    updateTimerDisplay();
    if (AppState.timer.seconds % 60 === 0 && AppState.timer.seconds > 0) {
      CyberAudio.play('timerTick');
    }
    if (AppState.timer.seconds <= 0) {
      timerComplete();
    }
  }, 1000);

  // Sync session to backend
  const subject = document.getElementById('timer-subject')?.value;
  api('/sessions', {
    method: 'POST',
    body: {
      type: AppState.timer.mode,
      plannedMinutes: Math.floor(TIMER_MODES[AppState.timer.mode] / 60),
      subject: subject || 'General Study'
    }
  }).then(data => {
    AppState.timer.session = data.session;
  }).catch(() => {});
}

function pauseTimer() {
  clearInterval(AppState.timer.interval);
  AppState.timer.running = false;
  CyberAudio.play('click');
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
  CyberAudio.play('alarm');
  toast(`🎉 ${AppState.timer.mode === 'pomodoro' ? 'Focus Reactor Cycle Complete!' : 'Break Cycle Finished!'}`, 'success', 6000);

  if (Notification.permission === 'granted') {
    new Notification('Focus Reactor Alert', {
      body: AppState.timer.mode === 'pomodoro' ? '⚡ Focus cycle complete! Take a breather.' : '🚀 Break over. Engage next focus run!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>'
    });
  }

  if (AppState.timer.session) {
    const plannedMins = Math.floor(TIMER_MODES[AppState.timer.mode] / 60);
    api(`/sessions/${AppState.timer.session._id}/complete`, {
      method: 'PUT',
      body: { actualMinutes: plannedMins, mood: 'good', productivityScore: 9 }
    }).catch(() => {});
  }

  // Auto switch
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

/* ═══════════════════════════════════════════════════════
   AI CHAT ASSISTANT
   ═══════════════════════════════════════════════════════ */
async function sendChatMessage(message) {
  if (!message.trim()) return;

  addChatMessage(message, 'user');
  AppState.chatHistory.push({ role: 'user', content: message });
  CyberAudio.play('click');

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
    CyberAudio.play('success');
  } catch(e) {
    removeTypingIndicator(typingId);
    addChatMessage('Neural Core latency alert: Unable to complete response. Please check network/key settings.', 'ai');
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

/* ═══════════════════════════════════════════════════════
   AI STUDY PLAN GENERATOR
   ═══════════════════════════════════════════════════════ */
async function generateStudyPlan(formData) {
  showLoading('⚡ Quantum AI calculating optimal study trajectory...');
  CyberAudio.play('click');
  try {
    const data = await api('/ai/generate-study-plan', {
      method: 'POST',
      body: formData
    });
    hideLoading();
    renderStudyPlan(data);
    CyberAudio.play('success');
    toast('Study Plan Blueprint Generated!', 'success');
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
    <div class="card mb-24 card-hud">
      <div class="card-title text-accent">📋 ${escapeHtml(plan.planTitle || 'Neural Study Blueprint')}</div>
      <p class="text-secondary mb-16">${escapeHtml(plan.overview || '')}</p>
      <div class="countdown-grid mb-16">
        <div class="countdown-unit">
          <div class="countdown-num">${days}</div>
          <div class="countdown-unit-label">Days to Target</div>
        </div>
        <div class="countdown-unit">
          <div class="countdown-num">${plan.weeklyPlan?.length || 1}</div>
          <div class="countdown-unit-label">Weeks Cycle</div>
        </div>
      </div>
    </div>

    ${plan.learningStrategies?.length ? `
    <div class="card mb-24">
      <div class="card-title">🧠 High-Performance Cognitive Strategies</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;">
        ${plan.learningStrategies.map(s => `
          <li style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:var(--accent);margin-top:1px;">⚡</span>
            <span class="text-secondary text-sm">${escapeHtml(s)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${plan.weeklyPlan?.map(week => `
      <div class="card mb-16">
        <div class="card-title">📅 Phase ${week.week}: ${escapeHtml(week.theme || 'Core Focus')}</div>
        <div style="display:grid;gap:10px;">
          ${Object.entries(week.dailyBreakdown || {}).map(([day, sessions]) => `
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px;border:1px solid var(--border-light);">
              <div class="font-hud text-accent" style="font-size:12px;margin-bottom:8px;">${day}</div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${sessions.map(s => `
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${s.type==='break'?'var(--green)':s.type==='revision'?'var(--yellow)':'var(--accent)'};box-shadow:0 0 6px ${s.type==='break'?'var(--green)':'var(--accent)'};"></span>
                    <span class="text-sm font-display">${escapeHtml(s.subject || '')} ${s.topic ? `— ${escapeHtml(s.topic)}` : escapeHtml(s.activity || '')}</span>
                    ${s.duration ? `<span class="badge badge-tag" style="margin-left:auto;">${s.duration}m</span>` : ''}
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
      <div class="card-title text-accent">💡 Synaptic Mindset Boost</div>
      <p class="text-secondary text-sm">${escapeHtml(plan.motivationalTip)}</p>
    </div>
    ` : ''}
  `;
}

/* ═══════════════════════════════════════════════════════
   AI NOTES SYNTHESIZER (NEW FUTURISTIC FEATURE)
   ═══════════════════════════════════════════════════════ */
async function handleSynthesizeNotes() {
  const text = document.getElementById('synth-input-text')?.value.trim();
  const style = document.getElementById('synth-style')?.value || 'concise';

  if (!text) {
    toast('Please input lecture notes or reading material', 'warning');
    return;
  }

  CyberAudio.play('click');
  const btn = document.getElementById('synth-submit-btn');
  const outputBox = document.getElementById('synth-output');
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Neural Synthesizing...';
    btn.disabled = true;
  }

  if (outputBox) {
    outputBox.innerHTML = '<div class="flex-center" style="padding:48px;"><div class="spinner" style="width:36px;height:36px;"></div><span class="text-accent text-sm ml-12" style="margin-left:12px;">Decoding synaptic notes matrix...</span></div>';
  }

  try {
    const data = await api('/ai/summarize', {
      method: 'POST',
      body: { text, style }
    });

    if (outputBox) {
      // Futuristic typewriter text reveal
      outputBox.innerHTML = '';
      typewriterRender(outputBox, formatMarkdown(data.summary));
      document.getElementById('synth-actions-bar')?.classList.remove('hidden');
      window._latestSummary = data.summary;
    }
    CyberAudio.play('success');
    toast('Synthesis complete!', 'success');
  } catch(e) {
    toast('Synthesis failed: ' + e.message, 'error');
    if (outputBox) outputBox.innerHTML = `<p class="text-red">Error during synthesis: ${escapeHtml(e.message)}</p>`;
  } finally {
    if (btn) {
      btn.innerHTML = '⚡ Synthesize Notes';
      btn.disabled = false;
    }
  }
}

function typewriterRender(element, htmlContent) {
  element.innerHTML = htmlContent;
  element.style.animation = 'sectionReveal 0.4s ease';
}

function copySynthesizedNotes() {
  if (!window._latestSummary) return;
  navigator.clipboard.writeText(window._latestSummary).then(() => {
    CyberAudio.play('click');
    toast('Summary copied to clipboard!', 'success');
  });
}

async function exportSummaryToTasks() {
  if (!window._latestSummary) return;
  CyberAudio.play('click');
  try {
    await api('/tasks', {
      method: 'POST',
      body: {
        title: 'Review: ' + (document.getElementById('synth-topic')?.value || 'Synthesized Lecture Notes'),
        description: window._latestSummary.slice(0, 500) + '...',
        priority: 'high',
        estimatedMinutes: 30,
        tags: ['synthesis', 'review']
      }
    });
    toast('Mission task added to Task Matrix! ✅', 'success');
    loadTasks();
  } catch(e) {
    toast('Could not export to task: ' + e.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════
   3D HOLOGRAPHIC FLASHCARDS
   ═══════════════════════════════════════════════════════ */
async function generateFlashcards(topic, subject, count) {
  showLoading('🃏 Holographic Flashcards Compiling...');
  CyberAudio.play('click');
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
    CyberAudio.play('success');
    toast(`${AppState.currentFlashcards.length} Quantum Flashcards Initialized!`, 'success');
  } catch(e) {
    hideLoading();
    toast('Failed to generate cards: ' + e.message, 'error');
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
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🃏</span><h3>No Card Decks Loaded</h3><p>Generate your first holographic set above.</p></div>`;
    return;
  }
  container.innerHTML = sets.map(set => `
    <div class="card card-hover pointer mb-12" onclick="loadFlashcardSet(${JSON.stringify(set.cards).replace(/"/g, '&quot;')}, '${escapeHtml(set.topic)}')">
      <div class="flex-between mb-8">
        <span class="badge badge-subject">${escapeHtml(set.subject)}</span>
        <span class="text-xs text-muted font-mono">${set.cards.length} CARDS</span>
      </div>
      <div class="card-title" style="margin-bottom:4px;">${escapeHtml(set.topic)}</div>
      <p class="text-xs text-muted">${formatDate(set.createdAt)}</p>
    </div>
  `).join('');
}

function loadFlashcardSet(cards, topic) {
  CyberAudio.play('click');
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
  CyberAudio.play('hover');
  document.getElementById('flashcard-inner')?.classList.toggle('flipped');
}

function nextFlashcard() {
  if (AppState.flashcardIndex < AppState.currentFlashcards.length - 1) {
    CyberAudio.play('click');
    AppState.flashcardIndex++;
    renderFlashcard();
    document.getElementById('flashcard-count').textContent = `${AppState.flashcardIndex + 1} / ${AppState.currentFlashcards.length}`;
  }
}

function prevFlashcard() {
  if (AppState.flashcardIndex > 0) {
    CyberAudio.play('click');
    AppState.flashcardIndex--;
    renderFlashcard();
    document.getElementById('flashcard-count').textContent = `${AppState.flashcardIndex + 1} / ${AppState.currentFlashcards.length}`;
  }
}

/* ═══════════════════════════════════════════════════════
   CYBER ALARM SYSTEM
   ═══════════════════════════════════════════════════════ */
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
    container.innerHTML = `<p class="text-muted text-xs">No active alerts scheduled.</p>`;
    return;
  }

  container.innerHTML = alarms.map(alarm => `
    <div class="flex-between" style="padding:10px 14px;background:var(--bg-elevated);border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--border-light);">
      <div>
        <div class="text-sm font-bold text-accent">🔔 ${escapeHtml(alarm.title)}</div>
        <div class="text-xs text-muted font-mono">${formatDateTime(alarm.time)} · ${alarm.repeat}</div>
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
    CyberAudio.play('success');
    toast('Alarm Synced! 🔔', 'success');
    requestNotificationPermission();
  } catch(e) {
    toast('Failed to set alarm', 'error');
  }
}

async function deleteAlarm(id) {
  try {
    await api(`/alarms/${id}`, { method: 'DELETE' });
    CyberAudio.play('click');
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
  CyberAudio.play('alarm');

  if (Notification.permission === 'granted') {
    new Notification(`⏰ ${alarm.title}`, {
      body: alarm.subject ? `Subject: ${alarm.subject}` : 'Target time to study reached!',
    });
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;';
  const popup = document.createElement('div');
  popup.className = 'card card-hud';
  popup.style.cssText = 'max-width:380px;text-align:center;padding:32px;box-shadow:var(--shadow-accent);';
  popup.innerHTML = `
    <div style="font-size:48px;margin-bottom:12px;">⏰</div>
    <h2 class="font-hud" style="font-size:20px;color:var(--accent);margin-bottom:8px;">${escapeHtml(alarm.title)}</h2>
    <p class="text-secondary mb-16">${alarm.subject ? `Target Focus: ${escapeHtml(alarm.subject)}` : 'Mission study alert activated!'}</p>
    <button class="btn btn-primary btn-full" onclick="this.closest('[data-alarm-container]').remove();">
      ✓ Acknowledge & Engage
    </button>
  `;
  overlay.dataset.alarmContainer = '1';
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/* ═══════════════════════════════════════════════════════
   CALENDAR ENGINE
   ═══════════════════════════════════════════════════════ */
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

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-num">${daysInPrevMonth - i}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayTasks = AppState.tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));

    html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="calDayClick('${dateStr}')">
      <div class="cal-num">${d}</div>
      ${dayTasks.slice(0, 2).map(t => `<div class="cal-event">${escapeHtml(t.title)}</div>`).join('')}
      ${dayTasks.length > 2 ? `<div class="cal-event">+${dayTasks.length - 2} more</div>` : ''}
    </div>`;
  }

  container.innerHTML = html;
}

function calDayClick(dateStr) {
  CyberAudio.play('click');
  const dayTasks = AppState.tasks.filter(t => t.dueDate?.startsWith(dateStr));
  if (dayTasks.length) {
    toast(`${dayTasks.length} task(s) scheduled on ${dateStr}`, 'info');
  }
}

/* ═══════════════════════════════════════════════════════
   QUANTUM ANALYTICS ENGINE
   ═══════════════════════════════════════════════════════ */
async function loadAnalytics() {
  try {
    const data = await api('/analytics');
    renderAnalytics(data.analytics);
  } catch(e) {
    console.error('Analytics error:', e);
  }
}

function renderAnalytics(analytics) {
  setEl('analytics-total-hours', Math.round(analytics.totalHoursStudied * 10) / 10);
  setEl('analytics-tasks-completed', analytics.totalTasksCompleted);
  setEl('analytics-streak', analytics.currentStreak);
  setEl('analytics-weekly-hours', analytics.weeklyHours);

  // Daily Chart
  const chartEl = document.getElementById('daily-chart');
  if (chartEl && analytics.dailyData) {
    const maxMins = Math.max(...analytics.dailyData.map(d => d.minutes), 60);
    chartEl.innerHTML = analytics.dailyData.map(d => {
      const pct = Math.max((d.minutes / maxMins) * 100, 4);
      const label = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
      const hrs = (d.minutes / 60).toFixed(1);
      return `
        <div class="chart-bar-wrap" title="${hrs} hours on ${d.date}">
          <div class="chart-bar" style="height:${pct}%;"></div>
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
      <div class="mb-12">
        <div class="flex-between mb-4">
          <span class="text-sm font-display">${item.label}</span>
          <span class="text-sm font-mono text-muted">${item.value}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(item.value/total)*100}%;background:${item.color};box-shadow:0 0 8px ${item.color};"></div>
        </div>
      </div>
    `).join('');
  }

  // Subject breakdown
  const subjectEl = document.getElementById('subject-breakdown');
  if (subjectEl && analytics.subjectBreakdown?.length) {
    const maxMins = Math.max(...analytics.subjectBreakdown.map(s => s.totalMinutes), 1);
    subjectEl.innerHTML = analytics.subjectBreakdown.map(s => `
      <div class="mb-12">
        <div class="flex-between mb-4">
          <span class="text-sm font-display">${escapeHtml(s._id || 'General')}</span>
          <span class="text-sm font-mono text-muted">${(s.totalMinutes/60).toFixed(1)}h</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(s.totalMinutes/maxMins)*100}%;"></div>
        </div>
      </div>
    `).join('');
  }
}

/* ═══════════════════════════════════════════════════════
   MISSION DASHBOARD
   ═══════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const motivationEl = document.getElementById('motivation-text');
    if (motivationEl) {
      api('/ai/motivation').then(data => {
        motivationEl.textContent = data.message;
      }).catch(() => {
        motivationEl.textContent = `Welcome back, ${AppState.user?.name || 'Agent'}! Your cognitive engine is ready for deployment. 🚀`;
      });
    }

    const data = await api('/tasks?sort=-createdAt&status=pending');
    const container = document.getElementById('recent-tasks');
    if (container) {
      const tasks = data.tasks.slice(0, 5);
      if (!tasks.length) {
        container.innerHTML = `<div class="empty-state" style="padding:24px;"><p class="text-secondary text-sm">No pending tasks in queue. All systems clear!</p></div>`;
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

    const user = AppState.user;
    if (user?.stats) {
      setEl('dash-hours', Math.round(user.stats.totalHoursStudied * 10) / 10);
      setEl('dash-tasks', user.stats.totalTasksCompleted);
      setEl('dash-streak', user.stats.currentStreak);
    }

    updateExamCountdown();
  } catch(e) {
    console.error('Dashboard error:', e);
  }
}

function updateExamCountdown() {
  const examDate = localStorage.getItem('sp_exam_date');
  const examName = localStorage.getItem('sp_exam_name') || 'Target Exam';
  const countdownEl = document.getElementById('exam-countdown');

  if (!countdownEl) return;

  if (!examDate) {
    countdownEl.innerHTML = `<p class="text-muted text-sm text-center">No mission deadline registered. <button class="btn btn-ghost btn-sm" onclick="document.getElementById('exam-date-input')?.focus()">Set Target Date →</button></p>`;
    return;
  }

  const now = new Date();
  const exam = new Date(examDate);
  const diffTime = exam - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    countdownEl.innerHTML = `<p class="text-green text-center font-hud">🎉 ${escapeHtml(examName)} Mission Concluded!</p>`;
    return;
  }

  const hours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffTime / (1000 * 60)) % 60);
  const seconds = Math.floor((diffTime / 1000) % 60);

  countdownEl.innerHTML = `
    <p class="text-xs text-accent font-hud mb-12 text-center">🎯 TARGET: ${escapeHtml(examName)}</p>
    <div class="countdown-grid">
      <div class="countdown-unit"><div class="countdown-num">${diffDays}</div><div class="countdown-unit-label">Days</div></div>
      <div class="countdown-unit"><div class="countdown-num">${hours}</div><div class="countdown-unit-label">Hours</div></div>
      <div class="countdown-unit"><div class="countdown-num">${minutes}</div><div class="countdown-unit-label">Mins</div></div>
      <div class="countdown-unit"><div class="countdown-num">${seconds}</div><div class="countdown-unit-label">Secs</div></div>
    </div>
  `;
}

// Live 1-second exam countdown ticker
setInterval(() => {
  if (AppState.currentPage === 'dashboard') {
    updateExamCountdown();
  }
}, 1000);

/* ═══════════════════════════════════════════════════════
   CYBER OMNIBAR / COMMAND CENTER (CTRL+K)
   ═══════════════════════════════════════════════════════ */
const COMMANDS = [
  { icon: '🏠', title: 'Go to Dashboard', category: 'Navigation', action: () => navigateTo('dashboard') },
  { icon: '✅', title: 'Go to Task Manager', category: 'Navigation', action: () => navigateTo('tasks') },
  { icon: '➕', title: 'Create New Task', category: 'Actions', action: () => showModal('task-modal') },
  { icon: '⏱️', title: 'Open Focus Timer', category: 'Navigation', action: () => navigateTo('timer') },
  { icon: '▶️', title: 'Start Pomodoro (25m)', category: 'Actions', action: () => { navigateTo('timer'); startTimer(); } },
  { icon: '⚡', title: 'AI Notes Synthesizer', category: 'AI Tools', action: () => navigateTo('summarizer') },
  { icon: '🤖', title: 'Open AI Assistant', category: 'AI Tools', action: () => navigateTo('chat') },
  { icon: '🃏', title: 'Review Flashcards', category: 'AI Tools', action: () => navigateTo('flashcards') },
  { icon: '📅', title: 'Generate AI Study Plan', category: 'AI Tools', action: () => navigateTo('planner') },
  { icon: '📆', title: 'View Calendar', category: 'Navigation', action: () => navigateTo('calendar') },
  { icon: '📊', title: 'View Quantum Analytics', category: 'Navigation', action: () => navigateTo('analytics') },
  { icon: '🧠', title: 'Play Alpha Waves 432Hz', category: 'Audio', action: () => { CyberAudio.toggleSoundscape('alpha'); } },
  { icon: '🌧️', title: 'Play Cyber Rain Soundscape', category: 'Audio', action: () => { CyberAudio.toggleSoundscape('rain'); } },
  { icon: '🌓', title: 'Toggle Theme (Dark/Light)', category: 'Settings', action: () => toggleTheme() },
  { icon: '🔊', title: 'Toggle Cyber SFX Sound', category: 'Audio', action: () => toggleSFXMute() }
];

function openOmnibar() {
  CyberAudio.play('click');
  const overlay = document.getElementById('omnibar-overlay');
  const input = document.getElementById('omnibar-input');
  if (overlay) {
    overlay.classList.add('active');
    renderOmnibarResults('');
    setTimeout(() => input?.focus(), 100);
  }
}

function closeOmnibar() {
  const overlay = document.getElementById('omnibar-overlay');
  if (overlay) overlay.classList.remove('active');
}

function renderOmnibarResults(query) {
  const container = document.getElementById('omnibar-results');
  if (!container) return;

  const q = query.toLowerCase().trim();
  const filtered = COMMANDS.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));

  if (!filtered.length) {
    container.innerHTML = `<div class="p-16 text-center text-muted text-sm">No command matches found.</div>`;
    return;
  }

  container.innerHTML = filtered.map((cmd, i) => `
    <div class="omnibar-item ${i === 0 ? 'selected' : ''}" onclick="executeOmnibarCommand(${COMMANDS.indexOf(cmd)})">
      <span>${cmd.icon}</span>
      <span class="font-display">${cmd.title}</span>
      <span class="omnibar-item-badge">${cmd.category}</span>
    </div>
  `).join('');
}

function executeOmnibarCommand(index) {
  const cmd = COMMANDS[index];
  if (cmd) {
    closeOmnibar();
    cmd.action();
  }
}

/* ═══════════════════════════════════════════════════════
   HELPERS & THEME
   ═══════════════════════════════════════════════════════ */
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
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<h4 class="font-hud text-accent" style="margin:10px 0 4px;">$1</h4>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br>');
}

function toggleTheme() {
  CyberAudio.play('click');
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sp_theme', next);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
}

function loadTheme() {
  const saved = localStorage.getItem('sp_theme') || (AppState.user?.preferences?.theme || 'dark');
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = saved === 'light' ? '🌙' : '☀️';

  // Load sound preference
  const sfxMuted = localStorage.getItem('sp_sfx_muted') === 'true';
  AppState.sfxMuted = sfxMuted;
  const sfxBtn = document.getElementById('sfx-toggle');
  if (sfxBtn) sfxBtn.innerHTML = sfxMuted ? '🔇' : '🔊';
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Omnibar trigger (Ctrl+K or Cmd+K)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openOmnibar();
      return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        closeOmnibar();
      }
      return;
    }

    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      showModal('task-modal');
    }
    if (e.key === '1') navigateTo('dashboard');
    if (e.key === '2') navigateTo('tasks');
    if (e.key === '3') navigateTo('planner');
    if (e.key === '4') navigateTo('timer');
    if (e.key === '5') navigateTo('calendar');
    if (e.key === '6') navigateTo('chat');
    if (e.key === '7') navigateTo('summarizer');
    if (e.key === 'Escape') {
      closeOmnibar();
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}
