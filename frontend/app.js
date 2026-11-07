/* ═══════════════════════════════════════════════════════
   AI STUDY PLANNER — CYBER QUANTUM CORE ENGINE
   ═══════════════════════════════════════════════════════ */

const API_BASE = '/api';

/* ─── GLOBAL APPLICATION STATE ─── */
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

  // UI Audio Cues (gentle chimes for completion & alarms)
  play(type = 'success') {
    if (AppState.sfxMuted || type === 'click' || type === 'hover') return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'success') {
        // Gentle pleasant completion chime
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          const t = now + i * 0.08;
          g.gain.setValueAtTime(0.06, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.start(t);
          o.stop(t + 0.3);
        });
      } else if (type === 'alarm') {
        [660, 880, 660, 880].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          const t = now + i * 0.12;
          g.gain.setValueAtTime(0.08, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          o.start(t);
          o.stop(t + 0.14);
        });
      }
    } catch (e) {
      // Audio not supported or blocked by browser
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
      alpha: '🧠 Calm Focus Tone (Alpha)',
      rain: '🌧️ Gentle Rain',
      drone: '🌌 Ambient White Noise',
      gamma: '⚡ Concentration Tone'
    };
    label.textContent = isActive ? titles[type] || 'Focus Sound Active' : 'Sound Off';
  }
}

function toggleSFXMute() {
  AppState.sfxMuted = !AppState.sfxMuted;
  localStorage.setItem('sp_sfx_muted', AppState.sfxMuted);
  const btn = document.getElementById('sfx-toggle');
  if (btn) {
    btn.innerHTML = AppState.sfxMuted ? '🔇' : '🔊';
    btn.title = AppState.sfxMuted ? 'Unmute Sound' : 'Mute Sound';
  }
}

function initCyberCanvas() {
  // Canvas particle loop disabled for clean, lightweight performance
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
   AUTHENTICATION ENGINE & SECURITY PROTOCOLS
   ═══════════════════════════════════════════════════════ */
function checkAuth() {
  const token = localStorage.getItem('sp_token');
  const userStr = localStorage.getItem('sp_user');
  if (token && userStr) {
    try {
      AppState.token = token;
      AppState.user = JSON.parse(userStr);
      return true;
    } catch (e) {}
  }
  return false;
}

function setUser(token, user) {
  AppState.token = token;
  AppState.user = user;
  localStorage.setItem('sp_token', token);
  localStorage.setItem('sp_user', JSON.stringify(user));
}

function showAuthPage() {
  const authEl = document.getElementById('auth-page');
  const appEl = document.getElementById('app-layout');
  if (authEl) {
    authEl.classList.remove('hidden');
    authEl.style.display = 'flex';
  }
  if (appEl) {
    appEl.classList.add('hidden');
  }
}

function showApp() {
  const authEl = document.getElementById('auth-page');
  const appEl = document.getElementById('app-layout');
  if (authEl) {
    authEl.classList.add('hidden');
    authEl.style.display = 'none';
  }
  if (appEl) {
    appEl.classList.remove('hidden');
  }

  const user = AppState.user;
  if (user) {
    setEl('sidebar-username', user.name || 'Student');
    setEl('sidebar-email', user.email || 'student@example.com');
    setEl('settings-name', user.name || 'Student');
    setEl('settings-email', user.email || 'student@example.com');

    const initial = (user.name || 'S')[0].toUpperCase();
    setEl('sidebar-avatar', initial);
    setEl('settings-avatar', initial);
  }

  loadDashboard();
  loadTasks().then(() => {
    updateTaskBadge();
    renderCalendar();
  });
  loadAlarms();
  startAlarmChecker();
  requestNotificationPermission();
  initHabitTracker();
}

function logout() {
  AppState.token = null;
  AppState.user = null;
  AppState.chatHistory = [];
  localStorage.removeItem('sp_token');
  localStorage.removeItem('sp_user');
  if (AppState.alarmCheckerInterval) clearInterval(AppState.alarmCheckerInterval);
  CyberAudio.stopSoundscape();
  showAuthPage();
  toast('Signed out successfully.', 'info');
}

/* ─── AUTH INTERACTIVE MODES (SIGN IN / SIGN UP / FORGOT) ─── */
function switchAuthTab(tab) {
  CyberAudio.play('click');
  const tabsContainer = document.getElementById('auth-main-tabs');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const googleBtn = document.getElementById('google-auth-btn');

  if (tab === 'login') {
    tabsContainer?.classList.remove('hidden');
    googleBtn?.classList.remove('hidden');
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
    forgotForm?.classList.add('hidden');
  } else if (tab === 'register') {
    tabsContainer?.classList.remove('hidden');
    googleBtn?.classList.remove('hidden');
    tabLogin?.classList.remove('active');
    tabRegister?.classList.add('active');
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
    forgotForm?.classList.add('hidden');
  } else if (tab === 'forgot') {
    tabsContainer?.classList.add('hidden');
    googleBtn?.classList.add('hidden');
    loginForm?.classList.add('hidden');
    registerForm?.classList.add('hidden');
    forgotForm?.classList.remove('hidden');
    document.getElementById('forgot-step-1')?.classList.remove('hidden');
    document.getElementById('forgot-step-2')?.classList.add('hidden');
  }
}

/* ─── PASSWORD EYE VISIBILITY TOGGLE ─── */
function togglePasswordVisibility(inputId, btn) {
  CyberAudio.play('hover');
  const input = document.getElementById(inputId);
  if (!input) return;
  const eyeOpen = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeClosed = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.innerHTML = eyeClosed;
  } else {
    input.type = 'password';
    if (btn) btn.innerHTML = eyeOpen;
  }
}

/* ─── PASSWORD STRENGTH METER ─── */
function checkPasswordStrength(val) {
  const bars = [
    document.getElementById('str-bar-1'),
    document.getElementById('str-bar-2'),
    document.getElementById('str-bar-3'),
    document.getElementById('str-bar-4')
  ];
  const label = document.getElementById('str-label-text');
  if (!val) {
    bars.forEach(b => b && (b.className = 'strength-segment'));
    if (label) { label.textContent = 'None'; label.style.color = 'var(--text-muted)'; }
    return;
  }

  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

  const levels = ['weak', 'fair', 'good', 'strong'];
  const names = ['Weak', 'Fair', 'Good', 'Strong ⚡'];
  const colors = ['var(--red)', 'var(--yellow)', 'var(--accent)', 'var(--green)'];

  bars.forEach((b, i) => {
    if (!b) return;
    b.className = 'strength-segment';
    if (i < score) {
      b.classList.add('active', levels[score - 1] || 'weak');
    }
  });

  if (label) {
    label.textContent = names[score - 1] || 'Weak';
    label.style.color = colors[score - 1] || 'var(--red)';
  }
}

/* ─── SUBMIT HANDLERS ─── */
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-submit-btn');

  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  btn.disabled = true;

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setUser(data.token, data.user);
    CyberAudio.play('success');
    toast(`Welcome back, ${data.user.name || 'Student'}! 👋`, 'success');
    showApp();
  } catch (err) {
    CyberAudio.play('alarm');
    toast(err.message || 'Authentication failed. Please verify credentials.', 'error');
  } finally {
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const btn = document.getElementById('register-submit-btn');

  if (password !== confirmPassword) {
    toast('Passwords do not match!', 'warning');
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> Creating account...';
  btn.disabled = true;

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
    setUser(data.token, data.user);
    CyberAudio.play('success');
    toast('Account created! Welcome 👋', 'success');
    showApp();
  } catch (err) {
    CyberAudio.play('alarm');
    toast(err.message || 'Registration failed.', 'error');
  } finally {
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
  }
}

/* ─── GOOGLE AUTHENTIC SIGN-IN HANDLERS ─── */
let googleClientId = null;
let googleTokenClient = null;

async function initGoogleAuth() {
  try {
    const res = await fetch((window.API_BASE || '') + '/api/auth/google/config');
    const data = await res.json();
    if (data && data.clientId) {
      googleClientId = data.clientId;
      setupGoogleIdentity(data.clientId);
    }
  } catch (err) {
    console.warn('Could not fetch Google client ID config:', err);
  }
}

function setupGoogleIdentity(clientId) {
  if (typeof google === 'undefined' || !google.accounts) {
    setTimeout(() => setupGoogleIdentity(clientId), 600);
    return;
  }

  try {
    // 1. Setup Google Identity Services (One-Tap / ID Token JWT)
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Optionally render official Google button if container exists
    const container = document.getElementById('google-official-btn');
    if (container) {
      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
    }

    // 2. Setup OAuth2 Token Client for authentic Google popup prompt
    if (google.accounts.oauth2) {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            await verifyAndLoginWithGoogle({ accessToken: tokenResponse.access_token });
          } else if (tokenResponse && tokenResponse.error) {
            console.error('Google token error:', tokenResponse);
            toast('Google sign-in error: ' + (tokenResponse.error_description || tokenResponse.error), 'error');
          }
        }
      });
    }
  } catch (e) {
    console.warn('Google Identity initialization error:', e);
  }
}

async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    toast('No credential received from Google', 'error');
    return;
  }
  await verifyAndLoginWithGoogle({ credential: response.credential });
}

async function verifyAndLoginWithGoogle(payload) {
  showLoading('Verifying authentic Google account...');
  try {
    const data = await api('/auth/google', {
      method: 'POST',
      body: payload
    });
    hideLoading();
    setUser(data.token, data.user);
    CyberAudio.play('success');
    toast(`Authenticated as ${data.user.email}! Welcome ${data.user.name} 👋`, 'success');
    showApp();
  } catch (err) {
    hideLoading();
    CyberAudio.play('alarm');
    toast('Google authentication failed: ' + err.message, 'error');
  }
}

async function handleGoogleLoginDirect() {
  // If we don't have a Client ID yet, fetch it
  if (!googleClientId) {
    try {
      const res = await fetch((window.API_BASE || '') + '/api/auth/google/config');
      const data = await res.json();
      if (data && data.clientId) {
        googleClientId = data.clientId;
        setupGoogleIdentity(data.clientId);
      }
    } catch (_) {}
  }

  // If still missing, prompt user with setup modal
  if (!googleClientId) {
    showModal('google-setup-modal');
    return;
  }

  // Ensure Google Identity SDK is loaded
  if (typeof google === 'undefined' || !google.accounts) {
    toast('Loading Google Sign-In service, please try again in a moment...', 'info');
    return;
  }

  if (googleTokenClient) {
    googleTokenClient.requestAccessToken({ prompt: 'select_account' });
  } else if (google.accounts.id) {
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const redirectUri = window.location.origin + window.location.pathname;
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;
        window.location.href = oauthUrl;
      }
    });
  } else {
    const redirectUri = window.location.origin + window.location.pathname;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;
    window.location.href = oauthUrl;
  }
}

async function saveAndConnectGoogleClientId() {
  const input = document.getElementById('setup-google-client-id');
  const clientId = input ? input.value.trim() : '';
  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    toast('Please enter a valid Google Client ID (ending in .apps.googleusercontent.com)', 'warning');
    return;
  }

  showLoading('Saving Google Client ID...');
  try {
    const res = await fetch((window.API_BASE || '') + '/api/auth/google/set-client-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    });
    const data = await res.json();
    hideLoading();
    if (res.ok && data.success) {
      googleClientId = clientId;
      hideModal('google-setup-modal');
      setupGoogleIdentity(clientId);
      toast('Google OAuth configured! Opening Google Sign-In...', 'success');
      setTimeout(() => {
        handleGoogleLoginDirect();
      }, 500);
    } else {
      toast(data.message || 'Failed to configure Google Client ID', 'error');
    }
  } catch (err) {
    hideLoading();
    toast('Error saving Google Client ID: ' + err.message, 'error');
  }
}

function checkGoogleRedirectToken() {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      verifyAndLoginWithGoogle({ accessToken });
    }
  }
}

/* ─── FORGOT PASSWORD HANDLERS ─── */
async function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const btn = document.getElementById('forgot-send-btn');
  btn.innerHTML = '<span class="spinner"></span> Sending code...';
  btn.disabled = true;

  try {
    const data = await api('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });

    CyberAudio.play('success');
    toast(`Verification code: [ ${data.resetCode} ]`, 'info', 10000);

    // Switch to step 2
    document.getElementById('forgot-step-1')?.classList.add('hidden');
    document.getElementById('forgot-step-2')?.classList.remove('hidden');

    // Pre-fill code for effortless testing
    const codeInput = document.getElementById('forgot-code');
    if (codeInput && data.resetCode) {
      codeInput.value = data.resetCode;
    }
  } catch (err) {
    CyberAudio.play('alarm');
    toast(err.message || 'Could not locate account with that email', 'error');
  } finally {
    btn.innerHTML = 'Send 6-Digit Code';
    btn.disabled = false;
  }
}

async function handleResetPasswordSubmit() {
  const email = document.getElementById('forgot-email').value.trim();
  const resetCode = document.getElementById('forgot-code').value.trim();
  const newPassword = document.getElementById('forgot-new-password').value;
  const btn = document.getElementById('forgot-reset-btn');

  if (!resetCode || resetCode.length < 6) {
    toast('Please enter the 6-digit verification code', 'warning');
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    toast('New password must be at least 6 characters', 'warning');
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> Updating password...';
  btn.disabled = true;

  try {
    const data = await api('/auth/reset-password', {
      method: 'POST',
      body: { email, resetCode, newPassword }
    });
    setUser(data.token, data.user);
    CyberAudio.play('success');
    toast('Password updated! Logging you in...', 'success');
    showApp();
  } catch (err) {
    CyberAudio.play('alarm');
    toast(err.message || 'Reset failed. Check verification code.', 'error');
  } finally {
    btn.innerHTML = 'Update Password & Sign In';
    btn.disabled = false;
  }
}

/* ─── ONE-CLICK GUEST / DEMO LOGIN ─── */
async function handleGuestLogin() {
  showLoading('Starting guest session...');
  try {
    const data = await api('/auth/default-token');
    hideLoading();
    setUser(data.token, data.user);
    CyberAudio.play('success');
    toast('Welcome! Signed in as Guest 👋', 'success');
    showApp();
  } catch (err) {
    hideLoading();
    const defaultUser = {
      name: 'Student',
      email: 'student@example.com',
      stats: { totalHoursStudied: 0, totalTasksCompleted: 0, currentStreak: 1 }
    };
    setUser('guest_token', defaultUser);
    showApp();
  }
}

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════ */
function toast(message, type = 'info', duration = 3800) {
  const icons = { success: '✅', error: '⚠️', warning: '⚡', info: '📘' };
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
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    planner: 'Study Planner',
    timer: 'Focus Timer',
    calendar: 'Calendar',
    chat: 'AI Study Tutor',
    flashcards: 'Flashcards',
    summarizer: 'Summarize Notes',
    analytics: 'Study Progress',
    settings: 'Settings'
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

  const willOpen = open !== undefined ? open : (!sidebar.classList.contains('mobile-open') && !sidebar.classList.contains('open'));
  sidebar.classList.toggle('mobile-open', willOpen);
  sidebar.classList.toggle('open', willOpen);
  if (backdrop) backdrop.classList.toggle('active', willOpen);
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
        <span style="font-size:36px;">📝</span>
        <h3 style="font-size:16px;font-weight:600;">No tasks yet</h3>
        <p class="text-secondary text-sm">Add your first study task or assignment to get started.</p>
        <button class="btn btn-primary btn-sm mt-8" onclick="showModal('task-modal')">+ Add Task</button>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" id="task-${task._id}">
      <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTask('${task._id}', '${task.status}')" />
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="task-badge ${task.priority}">${task.priority}</span>
          ${task.subject ? `<span class="task-badge">${escapeHtml(task.subject)}</span>` : ''}
          ${task.dueDate ? `<span>📅 ${formatDate(task.dueDate)}</span>` : ''}
          ${task.tags?.slice(0, 3).map(t => `<span class="task-badge">#${t}</span>`).join('') || ''}
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
      toast('Task completed! Keep it up 🎉', 'success');
    }
  } catch(e) {
    toast('Failed to update task', 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
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

/* ═══════════════════════════════════════════════════════
   POMODORO TIMER
   ═══════════════════════════════════════════════════════ */
const TIMER_MODES = { pomodoro: 25 * 60, 'short-break': 5 * 60, 'long-break': 15 * 60 };

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
  const label = document.getElementById('timer-mode-label');
  if (label) {
    label.textContent = mode === 'pomodoro' ? 'Study Focus' : mode === 'short-break' ? 'Short Break' : 'Long Break';
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
  showLoading('Generating your study schedule with AI...');
  try {
    const data = await api('/ai/generate-study-plan', {
      method: 'POST',
      body: formData
    });
    hideLoading();
    renderStudyPlan(data);
    CyberAudio.play('success');
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
      <div class="card-title text-accent">📋 ${escapeHtml(plan.planTitle || 'Personalized Study Plan')}</div>
      <p class="text-secondary mb-16">${escapeHtml(plan.overview || '')}</p>
      <div class="flex gap-16 mb-16">
        <div class="stat-card" style="flex:1;">
          <div class="stat-value">${days}</div>
          <div class="stat-label">Days to Exam</div>
        </div>
        <div class="stat-card" style="flex:1;">
          <div class="stat-value">${plan.weeklyPlan?.length || 1}</div>
          <div class="stat-label">Total Weeks</div>
        </div>
      </div>
    </div>

    ${plan.learningStrategies?.length ? `
    <div class="card mb-24">
      <div class="card-title">💡 Recommended Study Strategies</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;">
        ${plan.learningStrategies.map(s => `
          <li style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:var(--accent);margin-top:1px;">✓</span>
            <span class="text-secondary text-sm">${escapeHtml(s)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${plan.weeklyPlan?.map(week => `
      <div class="card mb-16">
        <div class="card-title">📅 Week ${week.week}: ${escapeHtml(week.theme || 'Focus Theme')}</div>
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
   CAMERA DOCUMENT SCANNER & AI NOTE SUMMARIZER
   ═══════════════════════════════════════════════════════ */
let scannerStream = null;
let currentCameraFacing = 'environment';
let currentScannedImage = null;
let currentScannedMime = 'image/jpeg';

async function openCameraScanner() {
  CyberAudio.play('click');
  const modal = document.getElementById('camera-scanner-modal');
  const video = document.getElementById('scanner-video');
  const previewImg = document.getElementById('scanner-preview-img');
  const overlay = document.getElementById('scanner-frame-overlay');
  const liveControls = document.getElementById('scanner-live-controls');
  const reviewControls = document.getElementById('scanner-review-controls');

  if (previewImg) previewImg.style.display = 'none';
  if (video) video.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (liveControls) liveControls.classList.remove('hidden');
  if (reviewControls) reviewControls.classList.add('hidden');

  showModal('camera-scanner-modal');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Camera access not supported on this device/browser. Please upload a photo instead.', 'warning');
    return;
  }

  // Stop any existing stream
  if (scannerStream) {
    scannerStream.getTracks().forEach(t => t.stop());
  }

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentCameraFacing,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    if (video) {
      video.srcObject = scannerStream;
      video.play().catch(() => {});
    }
  } catch (err) {
    console.warn('Camera stream error:', err);
    toast('Could not open camera: ' + (err.message || 'Permission denied') + '. You can still upload a photo of your notes.', 'info');
  }
}

function closeCameraScanner() {
  if (scannerStream) {
    scannerStream.getTracks().forEach(t => t.stop());
    scannerStream = null;
  }
  const video = document.getElementById('scanner-video');
  if (video) video.srcObject = null;
  hideModal('camera-scanner-modal');
}

function switchScannerCamera() {
  currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
  openCameraScanner();
}

function compressImage(dataUrl, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function captureScannerPhoto() {
  const video = document.getElementById('scanner-video');
  const canvas = document.getElementById('scanner-canvas');
  const previewImg = document.getElementById('scanner-preview-img');
  const overlay = document.getElementById('scanner-frame-overlay');
  const liveControls = document.getElementById('scanner-live-controls');
  const reviewControls = document.getElementById('scanner-review-controls');

  if (!video || !canvas) return;

  CyberAudio.play('click');

  let width = video.videoWidth || 1280;
  let height = video.videoHeight || 720;
  const maxDim = 1200;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  currentScannedImage = dataUrl;
  currentScannedMime = 'image/jpeg';

  if (previewImg) {
    previewImg.src = dataUrl;
    previewImg.style.display = 'block';
  }
  if (video) video.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (liveControls) liveControls.classList.add('hidden');
  if (reviewControls) reviewControls.classList.remove('hidden');
}

function retakeScannerPhoto() {
  const video = document.getElementById('scanner-video');
  const previewImg = document.getElementById('scanner-preview-img');
  const overlay = document.getElementById('scanner-frame-overlay');
  const liveControls = document.getElementById('scanner-live-controls');
  const reviewControls = document.getElementById('scanner-review-controls');

  if (previewImg) previewImg.style.display = 'none';
  if (video) video.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (liveControls) liveControls.classList.remove('hidden');
  if (reviewControls) reviewControls.classList.add('hidden');
}

function confirmScannedPhoto() {
  if (!currentScannedImage) return;

  const thumb = document.getElementById('attached-scan-thumb');
  const badge = document.getElementById('attached-scan-badge');
  const desc = document.getElementById('attached-scan-desc');
  const topicInput = document.getElementById('synth-topic');

  if (thumb) thumb.src = currentScannedImage;
  if (badge) badge.classList.remove('hidden');
  if (desc) desc.textContent = 'Page photographed via camera scanner • Ready to summarize';
  if (topicInput && !topicInput.value.trim()) {
    topicInput.value = 'Scanned Lecture Notes';
  }

  closeCameraScanner();
  CyberAudio.play('success');
  toast('Notes scanned successfully! Click "Summarize Notes" to analyze', 'success');
}

function handleScannedFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast('Please select an image file', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const rawDataUrl = evt.target.result;
    toast('Optimizing photo for fast AI processing...', 'info', 1800);
    const optimizedImage = await compressImage(rawDataUrl, 1200, 0.82);
    currentScannedImage = optimizedImage;
    currentScannedMime = 'image/jpeg';

    const thumb = document.getElementById('attached-scan-thumb');
    const badge = document.getElementById('attached-scan-badge');
    const desc = document.getElementById('attached-scan-desc');
    const topicInput = document.getElementById('synth-topic');

    if (thumb) thumb.src = currentScannedImage;
    if (badge) badge.classList.remove('hidden');
    if (desc) desc.textContent = `${file.name} • Optimized for fast AI scan`;
    if (topicInput && !topicInput.value.trim()) {
      topicInput.value = file.name.replace(/\.[^/.]+$/, '');
    }

    CyberAudio.play('success');
    toast('Photo attached! Click "Summarize Notes" to analyze', 'success');
  };
  reader.readAsDataURL(file);
}

function removeAttachedScannedImage() {
  currentScannedImage = null;
  const badge = document.getElementById('attached-scan-badge');
  const fileInput = document.getElementById('scan-file-input');
  if (badge) badge.classList.add('hidden');
  if (fileInput) fileInput.value = '';
  toast('Attached scanned photo removed', 'info');
}

async function handleSynthesizeNotes() {
  const text = document.getElementById('synth-input-text')?.value.trim();
  const topic = document.getElementById('synth-topic')?.value.trim() || '';
  const style = document.getElementById('synth-style')?.value || 'concise';

  if (!text && !currentScannedImage) {
    toast('Please type your notes or use "Camera Scan" / "Upload Photo"', 'warning');
    return;
  }

  CyberAudio.play('click');
  const btn = document.getElementById('synth-submit-btn');
  const outputBox = document.getElementById('synth-output');
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> ' + (currentScannedImage ? 'Scanning & Summarizing...' : 'Summarizing...');
    btn.disabled = true;
  }

  if (outputBox) {
    outputBox.innerHTML = `
      <div class="flex-center" style="padding:48px;flex-direction:column;gap:14px;">
        <div class="spinner" style="width:36px;height:36px;"></div>
        <span class="text-accent text-sm font-bold">
          ${currentScannedImage ? 'AI Vision reading document and generating summary...' : 'Synthesizing notes with AI...'}
        </span>
        <span class="text-xs text-muted">Extracting key concepts, formulas, and high-yield takeaways</span>
      </div>`;
  }

  try {
    const payload = {
      text: text || '',
      style,
      topic
    };

    if (currentScannedImage) {
      payload.image = currentScannedImage;
      payload.mimeType = currentScannedMime || (currentScannedImage.match(/^data:([^;]+);/) ? currentScannedImage.match(/^data:([^;]+);/)[1] : 'image/jpeg');
    }

    const data = await api('/ai/summarize', {
      method: 'POST',
      body: payload
    });

    if (outputBox) {
      outputBox.innerHTML = '';
      typewriterRender(outputBox, formatMarkdown(data.summary));
      document.getElementById('synth-actions-bar')?.classList.remove('hidden');
      window._latestSummary = data.summary;
    }
    CyberAudio.play('success');
    toast('Notes summarized successfully! 🎯', 'success');
  } catch(e) {
    toast('Summary failed: ' + e.message, 'error');
    if (outputBox) outputBox.innerHTML = `<p class="text-red">Error during summary: ${escapeHtml(e.message)}</p>`;
  } finally {
    if (btn) {
      btn.innerHTML = '⚡ Summarize Notes';
      btn.disabled = false;
    }
  }
}

function typewriterRender(element, htmlContent) {
  element.innerHTML = htmlContent;
}

function copySynthesizedNotes() {
  if (!window._latestSummary) return;
  navigator.clipboard.writeText(window._latestSummary).then(() => {
    toast('Summary copied to clipboard!', 'success');
  });
}

function downloadSummaryPDF() {
  if (!window._latestSummary) {
    toast('No summary available to download as PDF', 'warning');
    return;
  }

  CyberAudio.play('click');
  const topic = document.getElementById('synth-topic')?.value.trim() || 'Study Notes';
  const cleanTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Primary: Direct vector PDF via jsPDF - zero blank pages, crisp text, instant (<30ms)
  const jsPdfLib = window.jspdf?.jsPDF || (typeof jsPDF !== 'undefined' ? jsPDF : null);
  if (jsPdfLib) {
    try {
      generateDirectVectorPDF(jsPdfLib, topic, window._latestSummary, cleanTopic);
      CyberAudio.play('success');
      toast('PDF downloaded successfully! 📄', 'success');
      return;
    } catch (err) {
      console.warn('Direct jsPDF error, trying HTML renderer:', err);
    }
  }

  // Fallback 1: html2pdf with properly visible layout
  if (typeof html2pdf !== 'undefined') {
    generateHtml2Pdf(topic, window._latestSummary, cleanTopic);
    return;
  }

  // Fallback 2: Browser print-to-PDF dialog
  fallbackPrintPDF(topic, window._latestSummary);
}

function generateDirectVectorPDF(jsPdfLib, title, markdownContent, cleanTopic) {
  const doc = new jsPdfLib({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Top color accent bar
  doc.setFillColor(79, 70, 229); // #4f46e5
  doc.rect(margin, y, contentWidth, 4, 'F');
  y += 20;

  // Header Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229);
  doc.text('AI STUDY PLANNER  •  HIGH-YIELD REVISION SUMMARY', margin, y);
  y += 22;

  // Main Topic Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += (titleLines.length * 22) + 4;

  // Date metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const dateStr = `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  doc.text(dateStr, margin, y);
  y += 14;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Process markdown lines
  const lines = markdownContent.split('\n');
  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y += 6;
      continue;
    }

    // Auto-pagination
    if (y > pageHeight - 55) {
      doc.addPage();
      y = margin + 10;
    }

    if (line.startsWith('### ') || line.startsWith('#### ')) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(67, 56, 202); // #4338ca
      const headerText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(headerText, contentWidth);
      doc.text(wrapped, margin, y);
      y += (wrapped.length * 16) + 4;
    } else if (line.startsWith('## ') || line.startsWith('# ')) {
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42);
      const headerText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(headerText, contentWidth);
      doc.text(wrapped, margin, y);
      y += (wrapped.length * 18) + 6;
    } else if (line.startsWith('• ') || line.startsWith('* ') || line.startsWith('- ')) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const bulletText = line.replace(/^[•*-]\s*/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(bulletText, contentWidth - 18);

      doc.setFillColor(79, 70, 229);
      doc.circle(margin + 5, y - 3, 2.2, 'F');
      doc.text(wrapped, margin + 16, y);
      y += (wrapped.length * 14.5) + 3;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const cleanLine = line.replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(cleanLine, contentWidth);
      doc.text(wrapped, margin, y);
      y += (wrapped.length * 14.5) + 3;
    }
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.75);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('AI Study Planner  •  Keep pushing your study streak!', margin, pageHeight - 16);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 45, pageHeight - 16);
  }

  doc.save(`Study-Summary-${cleanTopic}.pdf`);
}

function generateHtml2Pdf(topic, content, cleanTopic) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '750px';
  container.style.zIndex = '999999';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '36px 42px';
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.lineHeight = '1.65';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">AI Study Planner • High-Yield Summary</div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0;">${escapeHtml(topic)}</h1>
      <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
    <div style="font-size: 13.5px; color: #334155;">
      ${formatMarkdown(content)}
    </div>
  `;

  document.body.appendChild(container);

  toast('Generating PDF document...', 'info');
  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: `Study-Summary-${cleanTopic}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(container).save().then(() => {
    document.body.removeChild(container);
    CyberAudio.play('success');
    toast('PDF downloaded successfully! 📄', 'success');
  }).catch(() => {
    document.body.removeChild(container);
    fallbackPrintPDF(topic, content);
  });
}

function fallbackPrintPDF(title, content) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast('Pop-up blocked. Please allow pop-ups to export PDF', 'warning');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHtml(title)} - Summary PDF</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 24px; background: #fff; }
        h1 { color: #0f172a; margin-top: 0; }
        h2, h3 { color: #4338ca; margin-top: 18px; margin-bottom: 6px; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 6px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #4f46e5;">AI STUDY PLANNER</div>
        <h1>${escapeHtml(title)}</h1>
        <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
      </div>
      <div>${formatMarkdown(content)}</div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

async function exportSummaryToTasks() {
  if (!window._latestSummary) return;
  try {
    await api('/tasks', {
      method: 'POST',
      body: {
        title: 'Review: ' + (document.getElementById('synth-topic')?.value || 'Study Notes'),
        description: window._latestSummary.slice(0, 500) + '...',
        priority: 'high',
        estimatedMinutes: 30,
        tags: ['notes', 'review']
      }
    });
    toast('Task added to your tasks list! ✅', 'success');
    loadTasks();
  } catch(e) {
    toast('Could not export to task: ' + e.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════
   FLASHCARDS
   ═══════════════════════════════════════════════════════ */
async function generateFlashcards(topic, subject, count) {
  showLoading('Generating flashcards with AI...');
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
    toast(`${AppState.currentFlashcards.length} Flashcards Created!`, 'success');
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
    container.innerHTML = `<div class="card p-16 text-center text-muted text-sm">No flashcard decks yet. Generate your first deck above.</div>`;
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
   QUICK SEARCH / COMMAND PALETTE (CTRL+K)
   ═══════════════════════════════════════════════════════ */
const COMMANDS = [
  { icon: '🏠', title: 'Dashboard', category: 'Navigation', action: () => navigateTo('dashboard') },
  { icon: '✅', title: 'Tasks & Assignments', category: 'Navigation', action: () => navigateTo('tasks') },
  { icon: '➕', title: 'Add New Task', category: 'Actions', action: () => showModal('task-modal') },
  { icon: '⏱️', title: 'Focus Timer', category: 'Navigation', action: () => navigateTo('timer') },
  { icon: '▶️', title: 'Start 25m Timer', category: 'Actions', action: () => { navigateTo('timer'); startTimer(); } },
  { icon: '⚡', title: 'Summarize Notes', category: 'AI Tools', action: () => navigateTo('summarizer') },
  { icon: '🤖', title: 'Ask AI Tutor', category: 'AI Tools', action: () => navigateTo('chat') },
  { icon: '🃏', title: 'Review Flashcards', category: 'AI Tools', action: () => navigateTo('flashcards') },
  { icon: '📅', title: 'Create Study Schedule', category: 'AI Tools', action: () => navigateTo('planner') },
  { icon: '📆', title: 'Calendar', category: 'Navigation', action: () => navigateTo('calendar') },
  { icon: '📊', title: 'Progress & Stats', category: 'Navigation', action: () => navigateTo('analytics') },
  { icon: '🧠', title: 'Play Focus Tone (Alpha)', category: 'Audio', action: () => { CyberAudio.toggleSoundscape('alpha'); } },
  { icon: '🌧️', title: 'Play Rain Sounds', category: 'Audio', action: () => { CyberAudio.toggleSoundscape('rain'); } },
  { icon: '🌓', title: 'Toggle Theme (Dark / Light)', category: 'Settings', action: () => toggleTheme() },
  { icon: '🔊', title: 'Toggle Sound Effects', category: 'Settings', action: () => toggleSFXMute() }
];

function openOmnibar() {
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
