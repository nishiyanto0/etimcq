/* ═══════════════════════════════════════════
   ETI MCQ Challenge — game.js
   ═══════════════════════════════════════════ */

'use strict';

// ── UNIT METADATA ───────────────────────────
const UNITS = [
  { id:1, name:'Artificial Intelligence',          icon:'🤖', color:'#8b5cf6', desc:'AI types, ML, Deep Learning, NLP & more' },
  { id:2, name:'Internet of Things & 5G',          icon:'📡', color:'#3b82f6', desc:'5G features, IoT architecture, smart systems' },
  { id:3, name:'Blockchain Technology',            icon:'⛓️',  color:'#f59e0b', desc:'Distributed ledger, crypto, consensus & DApps' },
  { id:4, name:'Immersive Technology',             icon:'🥽', color:'#ec4899', desc:'AR, VR, MR, XR, metaverse applications' },
  { id:5, name:'Digital Forensics & Cybersecurity',icon:'🔐', color:'#10b981', desc:'Cyber threats, forensics, encryption & defence' },
  { id:'nirali', name:'Nirali Prakashan',        icon:'📚', color:'#6366f1', desc:'Complete Nirali Prakashan Question Bank (Unit & Subtopic Wise)', isNirali: true },
  { id:'smart', name:'Smart Test',               icon:'🧠', color:'#f43f5e', desc:'AI-powered practice based on your mistakes and flagged questions', isSmart: true },
  { id:'college', name:'College MCQ',              icon:'🎓', color:'#f97316', desc:'Mixed questions from all ETI topics', isCollege: true },
];

// ── STORAGE KEYS ────────────────────────────
import { createClient } from '@insforge/sdk';

const INSFORGE_CONFIG = {
  BASE_URL: 'https://c76uw4pw.ap-southeast.insforge.app',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTU2MTF9.eo9Y5AvTLT7wUClmMYrKC-144aiDgUb8oYekKlYIjas'
};

const insforge = createClient({
  baseUrl: INSFORGE_CONFIG.BASE_URL,
  anonKey: INSFORGE_CONFIG.ANON_KEY
});

let currentUser = null;

const STORAGE_KEYS = {
  MISTAKES: 'eti_mcq_mistakes',
  SCORES: 'eti_mcq_scores',
  REVISIONS: 'eti_mcq_revisions',
  COMPLETED: 'eti_mcq_completed',
  SESSIONS: 'eti_mcq_sessions',
  SYLLABUS: 'eti_mcq_syllabus',
};

// ── STATE ────────────────────────────────────
const state = {
  unitId: null,
  unitName: '',
  questions: [],
  current: 0,
  score: 0,
  total: 10,
  shuffledOpts: [],   // [{text, isCorrect}]
  answered: false,
  allQuestions: [],   // full question pool of current unit
  subtopic: null,      // selected subtopic (e.g., "1.1")
  niraliUnitId: null,  // selected unit for Nirali
  smartType: null,     // 'mistakes' or 'revisions'
  smartScope: 'personal', // 'personal' or 'global'
  isResumed: false,     // whether we are resuming a session
  questionStartTime: 0, // for time tracking
  questionTimes: [],    // time taken per question
  smartScore: 0,        // time-adjusted score
  playerName: '',       // player name for leaderboard
};

// ── DEFAULT NAME ─────────────────────────────
function getPlayerName() {
  const saved = localStorage.getItem('eti_mcq_player_name');
  return saved || '';
}

function savePlayerName(name) {
  localStorage.setItem('eti_mcq_player_name', name);
}

// ── SYLLABUS DATA ───────────────────────────
let syllabusData = null;

async function loadSyllabus() {
  if (syllabusData) return syllabusData;
  try {
    const r = await fetch('data/syllabus.json');
    syllabusData = await r.json();
    return syllabusData;
  } catch(e) {
    console.error('Failed to load syllabus:', e);
    return null;
  }
}

// ── STORAGE HELPERS ─────────────────────────
function getMistakes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MISTAKES) || '{}');
  } catch { return {}; }
}

function saveMistake(unitId, questionData) {
  const mistakes = getMistakes();
  const playerName = getPlayerName() || 'Anonymous';
  const entry = { ...questionData, unitId, user: playerName, ts: Date.now() };
  if (!mistakes.all) mistakes.all = [];
  mistakes.all.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  
  // Sync to InsForge
  syncToCloud('mistakes', entry);
}

function getRevisions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVISIONS) || '[]');
  } catch { return []; }
}

function getCompleted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED) || '[]');
  } catch { return []; }
}

function saveCompleted(questionData, unitId) {
  const completed = getCompleted();
  const playerName = getPlayerName() || 'Anonymous';
  const key = `${playerName}|${questionData.question}`;
  if (!completed.includes(key)) {
    completed.push(key);
    localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(completed));
  }
}

function isQuestionCompleted(questionText) {
  const completed = getCompleted();
  const playerName = getPlayerName() || 'Anonymous';
  return completed.includes(`${playerName}|${questionText}`);
}

function toggleRevision(questionData, unitId) {
  const revisions = getRevisions();
  const playerName = getPlayerName() || 'Anonymous';
  const idx = revisions.findIndex(r => r.question === questionData.question && r.user === playerName);
  
  const entry = { ...questionData, unitId, user: playerName, ts: Date.now() };
  if (idx > -1) {
    revisions.splice(idx, 1);
    deleteFromCloud('revisions', entry);
  } else {
    revisions.push(entry);
    syncToCloud('revisions', entry);
  }
  localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revisions));
  return idx === -1; // true if added
}

let getScores = function() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORES) || '[]');
  } catch { return []; }
};

function saveScore(entry) {
  const scores = getScores();
  scores.unshift(entry); 
  if (scores.length > 50) scores.pop();
  localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  syncScoreToCloud(entry); // Automatic real-time sync
}

// ── HELPERS ──────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

// ── RENDER HOME ───────────────────────────────
function renderHome() {
  const grid = document.getElementById('units-grid');
  grid.innerHTML = '';
  
  // Add leaderboard section first
  const leaderboardSection = document.createElement('div');
  leaderboardSection.className = 'leaderboard-section';
  leaderboardSection.innerHTML = `
    <h3 style="margin-bottom:12px;font-size:1.1rem;display:flex;align-items:center;gap:8px">
      <span>🏆</span> Leaderboard
    </h3>
    <div class="leaderboard-tabs" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <button class="lb-tab active" data-tab="recent">Recent</button>
      <button class="lb-tab" data-tab="player">Players</button>
      <button class="lb-tab" data-tab="unit">By Unit</button>
      <button class="lb-tab" data-tab="top">Top Scores</button>
    </div>
      <div style="font-size:0.7rem; color:var(--text3)">
        <span id="sync-status">Connecting to Cloud...</span>
      </div>
    </div>
    <div id="leaderboard-content" class="leaderboard-content"></div>
  `;
  grid.appendChild(leaderboardSection);
  
  renderLeaderboard('recent');
  loadGlobalScores(); 
  migrateToCloud(); // Sync local history to cloud

  // Check for saved session
  const saved = getSession();
  if (saved) {
    const resumeCard = document.createElement('div');
    resumeCard.className = 'unit-card';
    resumeCard.style.border = '1px solid #fbbf24';
    resumeCard.style.background = 'rgba(251,191,36,0.05)';
    resumeCard.innerHTML = `
      <div class="uc-icon">⏳</div>
      <div class="uc-name">Resume Test</div>
      <div class="uc-desc">You have an active session for ${saved.unitName}. Continue where you left off?</div>
      <div class="uc-count"><span class="uc-count-dot" style="background:#fbbf24"></span> Q${saved.current + 1} / ${saved.questions.length}</div>
    `;
    resumeCard.onclick = () => {
      Object.assign(state, saved);
      state.isResumed = true;
      showScreen('screen-quiz');
      renderQuestion();
    };
    grid.insertBefore(resumeCard, grid.children[1]); // Put it after the Smart Test card?
  }
  
  // Tab click handlers
  leaderboardSection.querySelectorAll('.lb-tab').forEach(tab => {
    tab.onclick = () => {
      leaderboardSection.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLeaderboard(tab.dataset.tab);
    };
  });
  
  UNITS.forEach((u, idx) => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.style.cssText = `--uc:${u.color}; animation-delay:${idx * 0.07}s`;
    card.innerHTML = `
      <div class="uc-accent"></div>
      <span class="uc-icon">${u.icon}</span>
      <div class="uc-num">Unit ${u.id}</div>
      <div class="uc-name">${u.name}</div>
      <p style="font-size:.82rem;color:var(--text2);line-height:1.5;margin-bottom:14px">${u.desc}</p>
      <span class="uc-count"><span class="uc-count-dot"></span> Loading…</span>
      <div class="uc-cta">Start Quiz <span>→</span></div>
    `;
    card.addEventListener('click', () => openSetup(u.id));
    grid.appendChild(card);
  });

  UNITS.forEach(async (u, idx) => {
    const cardEl = grid.children[idx + 1];
    const dot = cardEl.querySelector('.uc-count');
    
    if (u.isSmart) {
      const mistakes = getMistakes().all || [];
      const revisions = getRevisions();
      const total = mistakes.length + revisions.length;
      dot.innerHTML = `<span class="uc-count-dot" style="background:${u.color}"></span> ${total} tracked`;
      return;
    }

    try {
      let filePath = '';
      if (u.isCollege) filePath = 'data/college_mcq.json';
      else if (u.isNirali) filePath = 'data/nirali_mcq.json';
      else filePath = `data/unit_${u.id}.json`;

      const r = await fetch(filePath);
      const d = await r.json();
      if (dot) {
        dot.innerHTML = `<span class="uc-count-dot" style="background:${u.color}"></span> ${d.totalQuestions} questions`;
      }
      u._data = d; // cache
    } catch(_) {}
  });
}

// ── DATA SYNC (INSFORGE DB) ────────────────────
async function loadGlobalScores() {
  const statusEl = document.getElementById('sync-status');
  if (statusEl) statusEl.textContent = 'Syncing Leaderboard...';

  try {
    const { data, error } = await insforge.db.from('scores')
      .select('*')
      .order('smartScore', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    if (data && data.length > 0) {
      window._globalScores = data;
      if (statusEl) statusEl.textContent = `Cloud Sync Active (${data.length} total)`;
      renderLeaderboard(document.querySelector('.lb-tab.active')?.dataset.tab || 'recent');
    } else {
      if (statusEl) statusEl.textContent = 'Cloud Active (No Data)';
    }
  } catch(e) {
    console.warn('Could not load global scores:', e);
    if (statusEl) statusEl.textContent = 'Cloud Offline (Using Local)';
  }
}

async function syncToCloud(table, entry) {
  try {
    const { error } = await insforge.db.from(table).insert([entry]);
    if (error) throw error;
  } catch(e) {
    console.error(`Failed to sync to ${table}:`, e);
  }
}

async function deleteFromCloud(table, entry) {
  try {
    await insforge.db.from(table)
      .delete()
      .match({ user: entry.user, question: entry.question });
  } catch(e) {}
}

async function syncScoreToCloud(entry) {
  await syncToCloud('scores', entry);
  loadGlobalScores();
}

// Override getScores to combine local + global
const _origGetScores = getScores;
getScores = function() {
  const local = _origGetScores();
  const global = window._globalScores || [];
  const combined = [...local];
  global.forEach(g => {
    if (!combined.find(l => l.playerName === g.playerName && l.date === g.date)) {
      combined.push(g);
    }
  });
  return combined.sort((a, b) => b.date - a.date);
};

async function migrateToCloud() {
  const local = _origGetScores();
  if (local.length === 0) return;
  
  const statusEl = document.getElementById('sync-status');
  if (statusEl) statusEl.textContent = 'Migrating local history to cloud...';
  
  for (const s of local) {
    await syncToCloud('scores', s);
  }
  loadGlobalScores();
}

// ── AUTHENTICATION ────────────────────────────
window.openAuthModal = () => document.getElementById('screen-auth').classList.add('active');
window.closeAuthModal = () => document.getElementById('screen-auth').classList.remove('active');

window.switchAuthTab = (tab) => {
  const isLogin = tab === 'login';
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', isLogin ? t.textContent === 'Login' : t.textContent === 'Signup'));
  document.getElementById('login-form').style.display = isLogin ? 'flex' : 'none';
  document.getElementById('signup-form').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('auth-footer-text').innerHTML = isLogin 
    ? 'Don\'t have an account? <a href="#" onclick="switchAuthTab(\'signup\')">Sign up</a>'
    : 'Already have an account? <a href="#" onclick="switchAuthTab(\'login\')">Login</a>';
};

window.handleEmailSignup = async (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { data, error } = await insforge.auth.signUp({ email, password, name });
  if (error) return alert(error.message);
  
  if (data?.requireEmailVerification) {
    alert('Verification email sent! Please check your inbox.');
    closeAuthModal();
  }
};

window.handleEmailLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  
  updateUserSession(data.user);
  closeAuthModal();
};

window.handleGoogleLogin = async () => {
  await insforge.auth.signInWithOAuth({
    provider: 'google',
    redirectTo: window.location.origin
  });
};

window.handleLogout = async () => {
  await insforge.auth.signOut();
  updateUserSession(null);
};

async function checkUserSession() {
  const { data } = await insforge.auth.getCurrentUser();
  updateUserSession(data.user);
}

function updateUserSession(user) {
  currentUser = user;
  const dot = document.querySelector('.status-dot');
  const text = document.getElementById('auth-status-text');
  const toggleBtn = document.querySelector('.btn-auth-toggle');
  const profileCard = document.getElementById('user-profile-card');
  const guestInput = document.getElementById('guest-name-input');

  if (user) {
    dot.classList.add('active');
    text.textContent = 'Secured Cloud';
    toggleBtn.style.display = 'none';
    profileCard.style.display = 'flex';
    guestInput.style.display = 'none';
    
    const displayName = user.profile?.name || user.email.split('@')[0];
    document.getElementById('user-display-name').textContent = displayName;
    document.getElementById('user-avatar').src = user.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
    
    savePlayerName(displayName);
    const input = document.getElementById('player-name');
    if (input) input.value = displayName;
  } else {
    dot.classList.remove('active');
    text.textContent = 'Guest Mode';
    toggleBtn.style.display = 'block';
    profileCard.style.display = 'none';
    guestInput.style.display = 'block';
  }
}

// ── SESSION PERSISTENCE ────────────────────────
function saveSession() {
  if (state.questions.length === 0) return;
  const session = {
    unitId: state.unitId,
    unitName: state.unitName,
    questions: state.questions,
    current: state.current,
    score: state.score,
    allQuestions: state.allQuestions,
    subtopic: state.subtopic,
    niraliUnitId: state.niraliUnitId,
    smartType: state.smartType,
    smartScope: state.smartScope,
    questionTimes: state.questionTimes,
    date: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS));
  } catch { return null; }
}

// ── LEADERBOARD RENDER ─────────────────────────
// ── SCORING ENGINE ────────────────────────────────────

function buildPlayerProfiles(scores) {
  const profiles = {}; 

  scores.forEach(s => {
    const name = s.playerName || 'Anonymous';
    if (!profiles[name]) {
      profiles[name] = { name, buckets: {}, allAttempts: [] };
    }
    const p = profiles[name];
    p.allAttempts.push(s);

    const bucketKey = `${s.unitId}|${s.subtopic ?? '__all__'}`;
    if (!p.buckets[bucketKey]) {
      p.buckets[bucketKey] = {
        unitId: s.unitId,
        unitName: s.unitName,
        subtopic: s.subtopic ?? null,
        attempts: [],
      };
    }
    p.buckets[bucketKey].attempts.push({
      score: s.score,
      total: s.total,
      pct: s.pct ?? Math.round((s.score / s.total) * 100),
      smartScore: s.smartScore,
      time: s.time,
      date: s.date,
    });
  });

  Object.values(profiles).forEach(p => {
    let combinedScore = 0;
    let totalCorrect = 0, totalQs = 0;

    Object.values(p.buckets).forEach(b => {
      const avgAcc = Math.round(
        b.attempts.reduce((sum, a) => sum + a.pct, 0) / b.attempts.length
      );
      const avgSmart = Math.round(
        b.attempts.reduce((sum, a) => sum + a.smartScore, 0) / b.attempts.length
      );
      b.avgAcc    = avgAcc;
      b.avgSmart  = avgSmart;
      b.attemptCount = b.attempts.length;
      b.lastDate  = Math.max(...b.attempts.map(a => a.date));

      combinedScore += avgSmart;
      totalCorrect  += b.attempts.reduce((s, a) => s + a.score, 0);
      totalQs       += b.attempts.reduce((s, a) => s + a.total, 0);
    });

    p.combinedScore  = combinedScore;
    p.totalCorrect   = totalCorrect;
    p.totalQs        = totalQs;
    p.overallAvgAcc  = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
    p.bucketCount    = Object.keys(p.buckets).length;
    p.totalAttempts  = p.allAttempts.length;
    p.lastSeen       = Math.max(...p.allAttempts.map(a => a.date));
  });

  return profiles;
}

// ── SHARED HELPERS ────────────────────────────────────
function unitLabel(s) {
  if (s.unitId === 'nirali')   return 'Nirali';
  if (s.unitId === 'college')  return 'College';
  if (s.unitId === 'smart')    return 'Smart';
  return `Unit ${s.unitId}`;
}
function unitLabelFromId(id) {
  if (id === 'nirali')  return 'Nirali';
  if (id === 'college') return 'College';
  if (id === 'smart')   return 'Smart';
  return `Unit ${id}`;
}

function accuracyColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function rankEmoji(i) {
  return ['🥇','🥈','🥉'][i] || `${i + 1}`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── MAIN RENDER ───────────────────────────────────────
function renderLeaderboard(tab) {
  const container = document.getElementById('leaderboard-content');
  const scores    = getScores();

  if (scores.length === 0) {
    container.innerHTML = `<div style="color:var(--text3);font-size:.9rem;padding:16px 12px">
      No scores yet — complete a quiz to appear here!
    </div>`;
    return;
  }

  const profiles = buildPlayerProfiles(scores);
  const playersSorted = Object.values(profiles)
    .sort((a, b) => b.combinedScore - a.combinedScore);

  if (tab === 'recent') {
    const rows = scores.slice(0, 15).map((s, i) => {
      const acc     = s.pct ?? Math.round((s.score / s.total) * 100);
      const sub     = s.subtopic;
      const timeAgo = formatTimeAgo(s.date);
      return `
        <div class="lb2-row lb2-clickable" onclick="openPlayerModal('${(s.playerName||'Anonymous').replace(/'/g,"\\'")}')">
          <span class="lb2-rank">${i + 1}</span>
          <div class="lb2-main">
            <div class="lb2-top-line">
              <span class="lb2-name">${s.playerName || 'Anonymous'}</span>
              <span class="lb2-score">${s.score}/${s.total}</span>
              <span class="lb2-acc" style="color:${accuracyColor(acc)}">${acc}%</span>
            </div>
            <div class="lb2-sub-line">
              <span class="lb2-unit-tag">${unitLabel(s)}</span>
              ${sub ? `<span class="lb2-subtopic-tag">${sub}</span>` : ''}
              <span class="lb2-time-ago">${timeAgo}</span>
              <span class="lb2-duration">⏱ ${formatTime(s.time)}</span>
            </div>
          </div>
          <div class="lb2-right">
            <span class="lb2-smart">⭐ ${s.smartScore}</span>
            <span class="lb2-tap-hint">tap →</span>
          </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="lb2-list">${rows}</div>`;

  } else if (tab === 'player') {
    const rows = playersSorted.map((p, i) => `
      <div class="lb2-player-card lb2-clickable" onclick="openPlayerModal('${p.name.replace(/'/g,"\\'")}')">
        <div class="lb2-player-header">
          <span class="lb2-player-rank">${rankEmoji(i)}</span>
          <div class="lb2-player-name-wrap">
            <span class="lb2-player-name">${p.name}</span>
            <span class="lb2-player-meta">${p.bucketCount} topic${p.bucketCount !== 1 ? 's' : ''} · ${p.totalAttempts} attempt${p.totalAttempts !== 1 ? 's' : ''} · ${formatTimeAgo(p.lastSeen)}</span>
          </div>
          <div class="lb2-combined-score">
            <span class="lb2-combined-val">⭐ ${p.combinedScore}</span>
            <span class="lb2-combined-lbl">combined</span>
          </div>
        </div>
        <div class="lb2-player-stats">
          <div class="lb2-stat-pill">
            <span class="lb2-stat-val" style="color:${accuracyColor(p.overallAvgAcc)}">${p.overallAvgAcc}%</span>
            <span class="lb2-stat-lbl">avg acc</span>
          </div>
          <div class="lb2-stat-pill">
            <span class="lb2-stat-val">${p.totalCorrect}/${p.totalQs}</span>
            <span class="lb2-stat-lbl">correct</span>
          </div>
          <div class="lb2-stat-pill">
            <span class="lb2-stat-val">${p.bucketCount}</span>
            <span class="lb2-stat-lbl">topics done</span>
          </div>
          <div class="lb2-stat-pill">
            <span class="lb2-stat-val">${p.totalAttempts}</span>
            <span class="lb2-stat-lbl">attempts</span>
          </div>
        </div>
        <div class="lb2-topic-bars">
          ${Object.values(p.buckets).slice(0, 4).map(b => `
            <div class="lb2-topic-bar-wrap" title="${unitLabelFromId(b.unitId)}${b.subtopic ? ' › ' + b.subtopic : ''} — avg ${b.avgAcc}%">
              <div class="lb2-topic-bar-label">${unitLabelFromId(b.unitId)}${b.subtopic ? ' › ' + b.subtopic : ''}</div>
              <div class="lb2-topic-bar-track">
                <div class="lb2-topic-bar-fill" style="width:${b.avgAcc}%;background:${accuracyColor(b.avgAcc)}"></div>
              </div>
              <span class="lb2-topic-bar-pct" style="color:${accuracyColor(b.avgAcc)}">${b.avgAcc}%</span>
            </div>`).join('')}
          ${Object.keys(p.buckets).length > 4 ? `<div class="lb2-more-topics">+${Object.keys(p.buckets).length - 4} more · tap to see all</div>` : ''}
        </div>
      </div>`).join('');

    container.innerHTML = `<div class="lb2-list">${rows}</div>`;

  } else if (tab === 'unit') {
    const byUnit = {};
    scores.forEach(s => {
      const key = s.unitId;
      if (!byUnit[key]) byUnit[key] = [];
      byUnit[key].push(s);
    });

    const sections = Object.entries(byUnit)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([unitId, arr]) => {
        const unitName = arr[0].unitName || unitLabelFromId(unitId);

        const byPlayerInUnit = {};
        arr.forEach(s => {
          const name = s.playerName || 'Anonymous';
          if (!byPlayerInUnit[name]) byPlayerInUnit[name] = [];
          byPlayerInUnit[name].push(s);
        });

        const playerRanks = Object.entries(byPlayerInUnit)
          .map(([name, attempts]) => {
            const avgAcc   = Math.round(attempts.reduce((sum, s) => sum + (s.pct ?? Math.round((s.score/s.total)*100)), 0) / attempts.length);
            const avgSmart = Math.round(attempts.reduce((sum, s) => sum + s.smartScore, 0) / attempts.length);
            const totalAtt = attempts.length;
            return { name, avgAcc, avgSmart, totalAtt };
          })
          .sort((a, b) => b.avgSmart - a.avgSmart)
          .slice(0, 3);

        const bySubtopic = {};
        arr.forEach(s => {
          const key = s.subtopic || '__all__';
          if (!bySubtopic[key]) bySubtopic[key] = [];
          bySubtopic[key].push(s);
        });
        const subtopicKeys = Object.keys(bySubtopic).filter(k => k !== '__all__');
        const subtopicBadges = subtopicKeys.map(k => {
          const subArr = bySubtopic[k];
          const avgAcc = Math.round(subArr.reduce((sum, s) => sum + (s.pct ?? Math.round((s.score/s.total)*100)), 0) / subArr.length);
          return `<span class="lb2-subtopic-tag" style="border-color:${accuracyColor(avgAcc)};color:${accuracyColor(avgAcc)}">${k} · avg ${avgAcc}%</span>`;
        }).join('');

        const playerRows = playerRanks.map((p, i) => `
          <div class="lb2-unit-attempt lb2-clickable" onclick="openPlayerModal('${p.name.replace(/'/g,"\\'")}')">
            <span class="lb2-rank" style="font-size:.8rem">${rankEmoji(i)}</span>
            <span class="lb2-name">${p.name}</span>
            <span class="lb2-acc" style="color:${accuracyColor(p.avgAcc)}">${p.avgAcc}%</span>
            <span class="lb2-smart">⭐ ${p.avgSmart} avg</span>
            <span class="lb2-duration" style="color:var(--text3)">${p.totalAtt} att</span>
          </div>`).join('');

        return `
          <div class="lb2-unit-section">
            <div class="lb2-unit-header">
              <div>
                <div class="lb2-unit-title">${unitLabelFromId(unitId)} · ${unitName}</div>
                <div class="lb2-unit-meta">${arr.length} total attempt${arr.length !== 1 ? 's' : ''} · ${Object.keys(byPlayerInUnit).length} player${Object.keys(byPlayerInUnit).length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            ${subtopicBadges ? `<div class="lb2-subtopic-row">${subtopicBadges}</div>` : ''}
            <div class="lb2-unit-attempts">${playerRows}</div>
          </div>`;
      }).join('');

    container.innerHTML = `<div class="lb2-list">${sections}</div>`;

  } else if (tab === 'top') {
    const rows = playersSorted.slice(0, 10).map((p, i) => `
      <div class="lb2-row lb2-clickable" onclick="openPlayerModal('${p.name.replace(/'/g,"\\'")}')">
        <span class="lb2-rank">${rankEmoji(i)}</span>
        <div class="lb2-main">
          <div class="lb2-top-line">
            <span class="lb2-name">${p.name}</span>
            <span class="lb2-acc" style="color:${accuracyColor(p.overallAvgAcc)}">${p.overallAvgAcc}% avg</span>
          </div>
          <div class="lb2-sub-line">
            <span class="lb2-unit-tag">${p.bucketCount} topics</span>
            <span class="lb2-unit-tag">${p.totalAttempts} attempts</span>
            <span class="lb2-time-ago">${formatTimeAgo(p.lastSeen)}</span>
          </div>
        </div>
        <div class="lb2-right">
          <span class="lb2-smart">⭐ ${p.combinedScore}</span>
          <span class="lb2-combined-lbl">combined</span>
        </div>
      </div>`).join('');
    container.innerHTML = `<div class="lb2-list">${rows}</div>`;
  }
}

// ── PLAYER MODAL ──────────────────────────────────────
function openPlayerModal(playerName) {
  const scores   = getScores();
  const profiles = buildPlayerProfiles(scores);
  const p        = profiles[playerName];
  if (!p) return;

  const modal    = document.getElementById('player-modal');
  const content  = document.getElementById('player-modal-content');

  const bucketRows = Object.values(p.buckets)
    .sort((a, b) => b.avgSmart - a.avgSmart)
    .map(b => {
      const attRows = b.attempts
        .sort((a, b) => b.date - a.date)
        .map(a => `
          <div class="pm-attempt-row">
            <span class="pm-att-score">${a.score}/${a.total}</span>
            <span class="pm-att-acc" style="color:${accuracyColor(a.pct)}">${a.pct}%</span>
            <span class="pm-att-smart">⭐ ${a.smartScore}</span>
            <span class="pm-att-time">⏱ ${formatTime(a.time)}</span>
            <span class="pm-att-ago">${formatTimeAgo(a.date)}</span>
          </div>`).join('');

      const trendDots = b.attempts
        .slice(-8)
        .map(a => `<span class="pm-dot" style="background:${accuracyColor(a.pct)};height:${Math.max(4, a.pct * 0.18)}px" title="${a.pct}%"></span>`)
        .join('');

      return `
        <div class="pm-bucket">
          <div class="pm-bucket-header">
            <div>
              <div class="pm-bucket-title">
                ${unitLabelFromId(b.unitId)}
                ${b.subtopic ? `<span class="lb2-subtopic-tag" style="margin-left:6px">${b.subtopic}</span>` : ''}
              </div>
              <div class="pm-bucket-meta">${b.attemptCount} attempt${b.attemptCount !== 1 ? 's' : ''} · avg acc <span style="color:${accuracyColor(b.avgAcc)};font-weight:700">${b.avgAcc}%</span></div>
            </div>
            <div class="pm-bucket-smart">⭐ ${b.avgSmart}<span style="font-size:.6rem;color:var(--text3);display:block;text-align:center">avg pts</span></div>
          </div>
          <div class="pm-trend">${trendDots}</div>
          <div class="pm-attempts-list">${attRows}</div>
        </div>`;
    }).join('');

  content.innerHTML = `
    <div class="pm-header">
      <div class="pm-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div class="pm-header-info">
        <div class="pm-player-name">${p.name}</div>
        <div class="pm-player-sub">Last seen ${formatTimeAgo(p.lastSeen)}</div>
      </div>
      <div class="pm-combined-badge">
        <span class="pm-combined-num">⭐ ${p.combinedScore}</span>
        <span class="pm-combined-sub">combined score</span>
      </div>
    </div>

    <div class="pm-overview-grid">
      <div class="pm-ov-card">
        <span class="pm-ov-val" style="color:${accuracyColor(p.overallAvgAcc)}">${p.overallAvgAcc}%</span>
        <span class="pm-ov-lbl">overall acc</span>
      </div>
      <div class="pm-ov-card">
        <span class="pm-ov-val">${p.totalCorrect}/${p.totalQs}</span>
        <span class="pm-ov-lbl">correct</span>
      </div>
      <div class="pm-ov-card">
        <span class="pm-ov-val">${p.bucketCount}</span>
        <span class="pm-ov-lbl">topics</span>
      </div>
      <div class="pm-ov-card">
        <span class="pm-ov-val">${p.totalAttempts}</span>
        <span class="pm-ov-lbl">attempts</span>
      </div>
    </div>

    <div class="pm-section-title">Breakdown by Topic</div>
    <div class="pm-buckets">${bucketRows}</div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const modal = document.getElementById('player-modal');
  if (modal && e.target === modal) closePlayerModal();
});

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m${s}s`;
}

// ── SETUP MODAL ───────────────────────────────
async function openSetup(unitId) {
  const u = UNITS.find(x => x.id === unitId);
  state.unitId = unitId;
  state.total = 10;
  state.subtopic = null;
  state.niraliUnitId = null;

  document.getElementById('modal-icon').textContent = u.icon;
  document.getElementById('modal-unit-name').textContent = u.name;

  const nameInput = document.getElementById('player-name');
  nameInput.value = getPlayerName();

  if (!u._data) {
    try {
      let filePath = '';
      if (u.isCollege) filePath = 'data/college_mcq.json';
      else if (u.isNirali) filePath = 'data/nirali_mcq.json';
      else filePath = `data/unit_${unitId}.json`;
      
      const r = await fetch(filePath);
      u._data = await r.json();
    } catch(e) {
      console.error('Failed to load unit data:', e);
    }
  }

  const d = u._data;
  const totalQs = d?.totalQuestions || 0;
  const unitLabel = u.isCollege ? 'College MCQ' : (u.isNirali ? 'Nirali Bank' : `Unit ${u.id}`);
  document.getElementById('modal-unit-count').textContent = `${unitLabel} · ${totalQs} questions available`;

  const countBtns = document.getElementById('count-btns');
  const unitSelectDiv = document.getElementById('unit-select');
  const subtopicDiv = document.getElementById('subtopic-select');

  const playerName = getPlayerName() || 'Anonymous';
  const completed = getCompleted();
  const isTopicDone = (qList) => {
    if (!qList || qList.length === 0) return false;
    return qList.every(q => completed.includes(`${playerName}|${q.question}`));
  };

  const updateCountButtons = (availableCount) => {
    const counts = [10, 20, 30, 70];
    const playerName = getPlayerName() || 'Anonymous';
    const completed = getCompleted();
    
    // Determine current pool to check completion
    let currentPool = [];
    if (u.isNirali) {
      if (state.niraliUnitId) {
        const uNode = d.units.find(un => un.unitId === state.niraliUnitId);
        if (state.subtopic) {
          const st = uNode.subtopics.find(st => st.subtopicId === state.subtopic);
          currentPool = st ? st.questions : [];
        } else {
          currentPool = uNode.subtopics.flatMap(st => st.questions);
        }
      } else {
        currentPool = d.units.flatMap(un => un.subtopics.flatMap(st => st.questions));
      }
    } else if (u.isCollege) {
      currentPool = d.questions;
    } else {
      currentPool = d.questions;
      if (state.subtopic) currentPool = currentPool.filter(q => q.subtopic === state.subtopic);
    }
    
    const unseenCount = currentPool.filter(q => !completed.includes(`${playerName}|${q.question}`)).length;
    const isFullyDone = currentPool.length > 0 && unseenCount === 0;

    countBtns.innerHTML = counts.map(cnt => {
      const disabled = cnt > availableCount ? 'disabled' : '';
      const active = (cnt === state.total) ? 'active' : '';
      return `<button class="count-btn ${active} ${disabled} ${isFullyDone ? 'completed' : ''}" data-count="${cnt}" ${disabled ? 'disabled title="Not enough questions"' : ''}>${cnt}</button>`;
    }).join('') + `<button class="count-btn ${isFullyDone ? 'completed' : ''} ${state.total >= 999 ? 'active' : ''}" data-count="all">All (${availableCount}) ${isFullyDone ? '✅' : ''}</button>`;
    
    countBtns.querySelectorAll('.count-btn:not(.disabled)').forEach(btn => {
      btn.onclick = () => {
        countBtns.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.total = btn.dataset.count === 'all' ? 9999 : parseInt(btn.dataset.count);
      };
    });
  };

  if (u.isNirali) {
    unitSelectDiv.style.display = 'block';
    subtopicDiv.style.display = 'block';
    
    const uOptions = d.units.map(un => {
      const isDone = isTopicDone(un.subtopics.flatMap(st => st.questions));
      return `<button class="subtopic-btn ${isDone ? 'completed' : ''}" data-unit-id="${un.unitId}">${un.name} ${isDone ? '✅' : ''}</button>`;
    }).join('');
      
    unitSelectDiv.innerHTML = `
      <div style="margin-bottom:8px;font-weight:500">Select Unit:</div>
      <div class="subtopic-options">
        <button class="subtopic-btn active" data-unit-id="">Full Bank</button>
        ${uOptions}
      </div>
    `;

    const renderNiraliSubtopics = (unit) => {
      if (!unit) {
        subtopicDiv.innerHTML = '';
        return;
      }
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Select Subtopic:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active" data-subtopic="all">All from ${unit.unitName}</button>
          ${unit.subtopics.map(st => {
            const isDone = isTopicDone(st.questions);
            return `<button class="subtopic-btn ${isDone ? 'completed' : ''}" data-subtopic="${st.subtopicId}">${st.subtopicId} ${isDone ? '✅' : ''}</button>`;
          }).join('')}
        </div>
      `;
      
      subtopicDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
        btn.onclick = () => {
          subtopicDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.subtopic = btn.dataset.subtopic === 'all' ? null : btn.dataset.subtopic;
          
          let count = 0;
          if (state.subtopic) {
            count = unit.subtopics.find(st => st.subtopicId === state.subtopic).questions.length;
          } else {
            count = unit.subtopics.flatMap(st => st.questions).length;
          }
          updateCountButtons(count);
        };
      });
    };

    unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
      btn.onclick = () => {
        unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.niraliUnitId = btn.dataset.unitId === '' ? null : parseInt(btn.dataset.unitId);
        state.subtopic = null;
        
        if (state.niraliUnitId) {
          const unit = d.units.find(un => un.unitId === state.niraliUnitId);
          renderNiraliSubtopics(unit);
          updateCountButtons(unit.subtopics.flatMap(st => st.questions).length);
        } else {
          subtopicDiv.innerHTML = '';
          updateCountButtons(totalQs);
        }
      };
    });

    updateCountButtons(totalQs);
  } else if (u.isSmart) {
    unitSelectDiv.style.display = 'block';
    subtopicDiv.style.display = 'block';
    
    const allMistakes = getMistakes().all || [];
    const allRevisions = getRevisions();
    
    const myMistakes = allMistakes.filter(m => m.user === playerName);
    const myRevisions = allRevisions.filter(r => r.user === playerName);
    
    unitSelectDiv.innerHTML = `
      <div style="margin-bottom:8px;font-weight:500">Practice Scope:</div>
      <div class="subtopic-options">
        <button class="subtopic-btn active" data-scope="personal">Personal (${playerName})</button>
        <button class="subtopic-btn" data-scope="global">Global (This Device)</button>
      </div>
    `;

    const renderSmartModes = (scope) => {
      const mistList = scope === 'personal' ? myMistakes : allMistakes;
      const revList = scope === 'personal' ? myRevisions : allRevisions;
      
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Choose Mode:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active" data-mode="mistakes">Mistakes (${mistList.length})</button>
          <button class="subtopic-btn" data-mode="revisions">Revision List (${revList.length})</button>
        </div>
      `;
      
      state.smartType = 'mistakes';
      updateCountButtons(mistList.length);
      
      subtopicDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
        btn.onclick = () => {
          subtopicDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.smartType = btn.dataset.mode;
          const count = state.smartType === 'mistakes' ? mistList.length : revList.length;
          updateCountButtons(count);
        };
      });
    };

    state.smartScope = 'personal';
    renderSmartModes('personal');

    unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
      btn.onclick = () => {
        unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.smartScope = btn.dataset.scope;
        renderSmartModes(state.smartScope);
      };
    });
  } else {
    unitSelectDiv.style.display = 'none';
    const syllabus = await loadSyllabus();
    const unitSyllabus = syllabus?.units?.find(x => x.id === unitId);
    
    if (u.isCollege) {
      const isDone = isTopicDone(d.questions);
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Practice Mode:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active ${isDone ? 'completed' : ''}" data-subtopic="">
            Full Mixed Bank ${isDone ? '✅' : ''}
          </button>
        </div>
      `;
      subtopicDiv.style.display = 'block';
    } else if (unitSyllabus?.subtopics?.length > 0) {
      const stOptions = unitSyllabus.subtopics.map(st => {
        const stQs = d.questions.filter(q => q.subtopic === st.id);
        const isDone = isTopicDone(stQs);
        return `<button class="subtopic-btn ${isDone ? 'completed' : ''}" data-subtopic="${st.id}">${st.id} ${isDone ? '✅' : ''}</button>`;
      }).join('');
      
      const isFullDone = isTopicDone(d.questions);
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Select Scope:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active ${isFullDone ? 'completed' : ''}" data-subtopic="all">Entire Unit ${isFullDone ? '✅' : ''}</button>
          ${stOptions}
        </div>
      `;
      subtopicDiv.style.display = 'block';
      subtopicDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
        btn.onclick = () => {
          subtopicDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.subtopic = btn.dataset.subtopic === 'all' ? null : btn.dataset.subtopic;
          const subQs = state.subtopic ? d.questions.filter(q => q.subtopic === state.subtopic).length : totalQs;
          updateCountButtons(subQs);
        };
      });
    } else {
      subtopicDiv.style.display = 'none';
    }
    updateCountButtons(totalQs);
  }

  showScreen('screen-setup');
}

function showHome() {
  saveSession();
  showScreen('screen-home');
  renderHome();
}

// ── START QUIZ ────────────────────────────────
async function startQuiz() {
  const playerName = getPlayerName();
  if (!playerName || playerName.trim().length < 2) {
    alert('Please enter your name first in the Home screen to track your progress!');
    showHome();
    return;
  }

  showScreen('screen-loading');

  try {
    const unit = UNITS.find(u => u.id === state.unitId);
    let data = unit?._data;
    if (!data && !unit?.isSmart) {
      let filePath = '';
      if (unit?.isCollege) filePath = 'data/college_mcq.json';
      else if (unit?.isNirali) filePath = 'data/nirali_mcq.json';
      else filePath = `data/unit_${state.unitId}.json`;
      
      const r = await fetch(filePath);
      data = await r.json();
      if (unit) unit._data = data;
    }

    let pool = [];
    if (unit?.isNirali) {
      if (state.niraliUnitId) {
        const uNode = data.units.find(un => un.unitId === state.niraliUnitId);
        if (state.subtopic) {
          pool = uNode.subtopics.find(st => st.subtopicId === state.subtopic).questions;
        } else {
          pool = uNode.subtopics.flatMap(st => st.questions);
        }
      } else {
        pool = data.units.flatMap(un => un.subtopics.flatMap(st => st.questions));
      }
    } else if (unit?.isSmart) {
      const playerName = getPlayerName() || 'Anonymous';
      const allMistakes = getMistakes().all || [];
      const allRevisions = getRevisions();
      
      if (state.smartType === 'mistakes') {
        pool = state.smartScope === 'personal' 
          ? allMistakes.filter(m => m.user === playerName)
          : allMistakes;
      } else {
        pool = state.smartScope === 'personal'
          ? allRevisions.filter(r => r.user === playerName)
          : allRevisions;
      }
      state.unitName = (state.smartType === 'mistakes' ? 'Mistakes Practice' : 'Revision List') + ` (${state.smartScope})`;
    } else {
      pool = data.questions;
      if (state.subtopic) {
        pool = pool.filter(q => q.subtopic === state.subtopic);
      }
      
      const playerName = getPlayerName() || 'Anonymous';
      const completed = getCompleted();
      const unseen = pool.filter(q => !completed.includes(`${playerName}|${q.question}`));
      
      if (unseen.length > 0) {
        pool = unseen;
      } else {
        const mistakes = (getMistakes().all || []).filter(m => m.user === playerName);
        const mistakeTexts = mistakes.map(m => m.question);
        pool.sort((a, b) => {
          const aMistake = mistakeTexts.includes(a.question);
          const bMistake = mistakeTexts.includes(b.question);
          return bMistake - aMistake;
        });
      }
    }

    pool = shuffle(pool);
    
    const count = Math.min(state.total, pool.length);
    state.questions   = pool.slice(0, count);
    state.allQuestions = pool;
    state.current     = 0;
    state.score       = 0;
    state.unitName    = data.name;
    state.questionTimes = [];
    state.smartScore  = 0;
    
    saveSession();

    let badgeText = '';
    if (unit?.isCollege) badgeText = 'College MCQ';
    else if (unit?.isNirali) badgeText = 'Nirali Bank';
    else if (unit?.isSmart) badgeText = 'Smart Test';
    else badgeText = `Unit ${state.unitId}`;
    document.getElementById('quiz-unit-badge').textContent = badgeText;

    showScreen('screen-quiz');
    renderQuestion();
  } catch(err) {
    console.error(err);
    alert('Could not load questions. Make sure you are running through a local server.');
    showHome();
  }
}

// ── RENDER QUESTION ───────────────────────────
function renderQuestion() {
  const q    = state.questions[state.current];
  const idx  = state.current;
  const tot  = state.questions.length;
  state.answered = false;
  state.questionStartTime = Date.now(); 

  document.getElementById('quiz-qnum').textContent = `Q ${idx + 1} / ${tot}`;
  document.getElementById('score-display').textContent = state.score;

  document.getElementById('progress-fill').style.width = `${(idx / tot) * 100}%`;

  document.getElementById('qcard-num').textContent = `Question ${String(idx + 1).padStart(2,'0')}`;
  document.getElementById('qcard-text').textContent = q.question;

  const reviseBtn = document.getElementById('revise-btn');
  const revisions = getRevisions();
  const isRevised = revisions.find(r => r.question === q.question);
  reviseBtn.classList.toggle('active', !!isRevised);
  reviseBtn.onclick = (e) => {
    e.stopPropagation();
    const added = toggleRevision(q, state.unitId);
    reviseBtn.classList.toggle('active', added);
  };

  const opts = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
  state.shuffledOpts = shuffle(opts);

  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  const labels = ['A','B','C','D'];
  state.shuffledOpts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.style.animationDelay = `${i * 0.07}s`;
    btn.innerHTML = `<span class="opt-label">${labels[i]}</span><span class="opt-text">${opt.text}</span>`;
    btn.addEventListener('click', () => handleAnswer(i, btn));
    grid.appendChild(btn);
  });

  const expl = document.getElementById('explanation-card');
  expl.classList.remove('visible');
  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'none';
}

// ── HANDLE ANSWER ─────────────────────────────
function handleAnswer(selectedIdx, clickedBtn) {
  if (state.answered) return;
  state.answered = true;

  const timeTaken = (Date.now() - state.questionStartTime) / 1000;
  state.questionTimes.push(timeTaken);

  const q       = state.questions[state.current];
  const correct = state.shuffledOpts[selectedIdx].isCorrect;
  const allBtns = document.querySelectorAll('.option-btn');

  if (correct) {
    state.score++;
    clickedBtn.classList.add('correct');
    saveCompleted(q, state.unitId);
    const sv = document.getElementById('score-display');
    sv.textContent = state.score;
    saveSession();
    sv.classList.remove('score-bump');
    void sv.offsetWidth; 
    sv.classList.add('score-bump');
  } else {
    clickedBtn.classList.add('wrong');
    saveMistake(state.unitId, q);
    allBtns.forEach((btn, i) => {
      if (state.shuffledOpts[i].isCorrect) btn.classList.add('correct');
    });
  }

  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i !== selectedIdx && !state.shuffledOpts[i].isCorrect) {
      btn.classList.add('dimmed');
    }
  });

  document.getElementById('expl-text').textContent = q.explanation;
  document.getElementById('explanation-card').classList.add('visible');

  const nextBtn = document.getElementById('next-btn');
  nextBtn.innerHTML = (state.current === state.questions.length - 1)
    ? 'See Results 🎯'
    : 'Next Question <span>→</span>';
  nextBtn.onclick = () => {
    state.current++;
    if (state.current < state.questions.length) {
      saveSession();
      renderQuestion();
    } else {
      clearSession();
      showResults();
    }
  };
  nextBtn.style.display = 'flex';
}

// ── RESULTS ───────────────────────────────────
function showResults() {
  const score   = state.score;
  const total   = state.questions.length;
  const pct     = Math.round((score / total) * 100);
  
  // Calculate smart score based on accuracy and time
  const avgTime = state.questionTimes.length > 0 
    ? state.questionTimes.reduce((a, b) => a + b, 0) / state.questionTimes.length 
    : 30;
  const totalTime = state.questionTimes.reduce((a, b) => a + b, 0);
  
  // Smart scoring: base score * time bonus/penalty
  // Faster answers = higher score. Target: 15s per question
  const targetTime = 15;
  const timeFactor = Math.max(0.5, Math.min(1.5, targetTime / avgTime));
  const smartScore = Math.round(score * 100 * timeFactor);
  state.smartScore = smartScore;

  document.getElementById('ring-score').textContent  = score;
  document.getElementById('ring-total').textContent  = '/' + total;
  document.getElementById('stat-pct').textContent    = pct + '%';
  document.getElementById('stat-correct').textContent = score;
  document.getElementById('stat-wrong').textContent  = total - score;
  
  const unitText = isNaN(state.unitId) ? state.unitId : `Unit ${state.unitId}`;
  document.getElementById('results-unit').textContent = `${unitText} · ${state.unitName}`;

  // Grade + emoji
  let grade, emoji, title;
  if      (pct >= 90) { grade='A+'; emoji='🏆'; title='Outstanding!'; }
  else if (pct >= 80) { grade='A';  emoji='🎉'; title='Excellent!'; }
  else if (pct >= 70) { grade='B';  emoji='😊'; title='Well Done!'; }
  else if (pct >= 60) { grade='C';  emoji='👍'; title='Good Effort!'; }
  else if (pct >= 50) { grade='D';  emoji='😅'; title='Keep Practicing!'; }
  else                { grade='F';  emoji='📚'; title='More Study Needed!'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('grade-badge').textContent   = grade;

  // Grade badge color
  const colors = { 'A+':'#8b5cf6','A':'#3b82f6','B':'#10b981','C':'#f59e0b','D':'#f97316','F':'#ef4444' };
  const gb = document.getElementById('grade-badge');
  gb.style.background = `linear-gradient(135deg, ${colors[grade]}, ${colors[grade]}cc)`;

  // Save score to leaderboard with player name
  const playerName = document.getElementById('player-name')?.value || 'Anonymous';
  savePlayerName(playerName);
  
  saveScore({
    unitId: state.unitId,
    unitName: state.unitName,
    subtopic: state.subtopic,
    score,
    total,
    pct,
    smartScore,
    avgTime: Math.round(avgTime * 10) / 10,
    time: Math.round(totalTime),
    date: Date.now(),
    playerName
  });

  showScreen('screen-results');

  // Animate ring
  requestAnimationFrame(() => {
    setTimeout(() => {
      const circumference = 2 * Math.PI * 50; // ~314.16
      const offset = circumference - (pct / 100) * circumference;
      const circle = document.getElementById('ring-circle');
      circle.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.1,1)';
      circle.style.strokeDashoffset = offset;
    }, 100);
  });
}

function restartQuiz() {
  // Reset ring
  document.getElementById('ring-circle').style.transition = 'none';
  document.getElementById('ring-circle').style.strokeDashoffset = '314.16';
  closeQuizMenu();
  openSetup(state.unitId);
}

// ── QUIZ MENU ────────────────────────────────
function toggleQuizMenu() {
  const dropdown = document.getElementById('quiz-dropdown');
  const btn = document.getElementById('quiz-menu-btn');
  dropdown.classList.toggle('open');
  btn.classList.toggle('open');
}

function closeQuizMenu() {
  const dropdown = document.getElementById('quiz-dropdown');
  const btn = document.getElementById('quiz-menu-btn');
  dropdown.classList.remove('open');
  btn.classList.remove('open');
}

function goHome() {
  closeQuizMenu();
  showHome();
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('quiz-dropdown');
  const btn = document.getElementById('quiz-menu-btn');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    closeQuizMenu();
  }
});

window.goHome = goHome;
window.startQuiz = startQuiz;
window.restartQuiz = restartQuiz;
window.toggleQuizMenu = toggleQuizMenu;
window.closeQuizMenu = closeQuizMenu;
window.showHome = showHome;

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
  renderHome();
  
  // Save name on every keystroke
  const nameInput = document.getElementById('player-name');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      savePlayerName(e.target.value);
    });
  }
});
