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
  { id:'college', name:'College MCQ',              icon:'🎓', color:'#f97316', desc:'Mixed questions from all ETI topics', isCollege: true },
];

// ── STORAGE KEYS ────────────────────────────
const STORAGE_KEYS = {
  MISTAKES: 'eti_mcq_mistakes',
  SCORES: 'eti_mcq_scores',
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

function saveMistake(unitId, questionIdx, questionText) {
  const mistakes = getMistakes();
  const key = `${unitId}`;
  if (!mistakes[key]) mistakes[key] = [];
  // Avoid duplicates
  if (!mistakes[key].find(m => m.idx === questionIdx)) {
    mistakes[key].push({ idx: questionIdx, text: questionText, ts: Date.now() });
  }
  localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
}

function getScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORES) || '[]');
  } catch { return []; }
}

function saveScore(entry) {
  const scores = getScores();
  scores.unshift(entry); // Add to beginning
  // Keep only last 50 scores
  if (scores.length > 50) scores.pop();
  localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
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
    <div class="leaderboard-tabs" style="display:flex;gap:8px;margin-bottom:12px">
      <button class="lb-tab active" data-tab="recent">Recent</button>
      <button class="lb-tab" data-tab="unit">By Unit</button>
      <button class="lb-tab" data-tab="top">Top Scores</button>
    </div>
    <div id="leaderboard-content" class="leaderboard-content"></div>
  `;
  grid.appendChild(leaderboardSection);
  
  // Render leaderboard
  renderLeaderboard('recent');
  
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
    try {
      let filePath = '';
      if (u.isCollege) filePath = 'data/college_mcq.json';
      else if (u.isNirali) filePath = 'data/nirali_mcq.json';
      else filePath = `data/unit_${u.id}.json`;

      const r = await fetch(filePath);
      const d = await r.json();
      const dot = grid.children[idx + 1].querySelector('.uc-count'); // +1 for leaderboard
      if (dot) {
        const count = u.isNirali ? d.totalQuestions : d.totalQuestions;
        dot.innerHTML = `<span class="uc-count-dot" style="background:${u.color}"></span> ${count} questions`;
      }
      u._data = d; // cache
    } catch(_) {}
  });
}

// ── LEADERBOARD RENDER ─────────────────────────
function renderLeaderboard(tab) {
  const container = document.getElementById('leaderboard-content');
  const scores = getScores();
  
  if (scores.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:.9rem;padding:12px">No scores yet. Complete a quiz to appear here!</div>';
    return;
  }
  
  let html = '<div class="lb-list">';
  
  if (tab === 'recent') {
    scores.slice(0, 10).forEach((s, i) => {
      html += `<div class="lb-row">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${s.playerName || 'Anonymous'}</span>
        <span class="lb-unit">${isNaN(s.unitId) ? s.unitId : 'Unit ' + s.unitId}</span>
        <span class="lb-score">${s.score}/${s.total}</span>
        <span class="lb-smart">⭐ ${s.smartScore}</span>
        <span class="lb-time">${formatTime(s.time)}</span>
      </div>`;
    });
  } else if (tab === 'unit') {
    // Group by unit
    const byUnit = {};
    scores.forEach(s => {
      if (!byUnit[s.unitId]) byUnit[s.unitId] = [];
      byUnit[s.unitId].push(s);
    });
    Object.entries(byUnit).forEach(([unitId, arr]) => {
      const best = arr.sort((a, b) => b.smartScore - a.smartScore)[0];
      const bestName = best.playerName || 'Anonymous';
      html += `<div class="lb-row">
        <span class="lb-unit">${isNaN(unitId) ? unitId : 'Unit ' + unitId}</span>
        <span class="lb-name">${bestName}</span>
        <span class="lb-score">${best.score}/${best.total}</span>
        <span class="lb-smart">⭐${best.smartScore}</span>
      </div>`;
    });
  } else {
    // Top scores by smartScore
    scores.sort((a, b) => b.smartScore - a.smartScore).slice(0, 10).forEach((s, i) => {
      const topName = s.playerName || 'Anonymous';
      html += `<div class="lb-row">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${topName}</span>
        <span class="lb-unit">${isNaN(s.unitId) ? s.unitId : 'Unit ' + s.unitId}</span>
        <span class="lb-score">${s.score}/${s.total}</span>
        <span class="lb-smart">⭐${s.smartScore}</span>
      </div>`;
    });
  }
  
  html += '</div>';
  container.innerHTML = html;
}

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

  // Populate saved player name
  const nameInput = document.getElementById('player-name');
  nameInput.value = getPlayerName();

  // Load data if not cached
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

  const totalQs = u._data?.totalQuestions || 0;
  const unitLabel = u.isCollege ? 'College MCQ' : (u.isNirali ? 'Nirali Bank' : `Unit ${u.id}`);
  document.getElementById('modal-unit-count').textContent = `${unitLabel} · ${totalQs} questions available`;

  const countBtns = document.getElementById('count-btns');
  const unitSelectDiv = document.getElementById('unit-select');
  const subtopicDiv = document.getElementById('subtopic-select');

  const updateCountButtons = (availableCount) => {
    const counts = [10, 20, 30, 70];
    countBtns.innerHTML = counts.map(cnt => {
      const disabled = cnt > availableCount ? 'disabled' : '';
      const active = cnt === 10 && cnt <= availableCount ? 'active' : '';
      return `<button class="count-btn ${active} ${disabled}" data-count="${cnt}" ${disabled ? 'title="Not enough questions"' : ''}>${cnt}</button>`;
    }).join('') + `<button class="count-btn" data-count="all">All (${availableCount})</button>`;
    
    if (availableCount < 10) {
      const allBtn = countBtns.querySelector('[data-count="all"]');
      if (allBtn) allBtn.classList.add('active');
      state.total = availableCount;
    } else {
      state.total = 10;
    }
    
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
    
    const renderNiraliSubtopics = (unit) => {
      if (!unit) {
        subtopicDiv.innerHTML = '';
        return;
      }
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Select Subtopic:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active" data-subtopic="all">All from ${unit.unitName}</button>
          ${unit.subtopics.map(st => `<button class="subtopic-btn" data-subtopic="${st.subtopicId}">${st.subtopicId} - ${st.subtopicName}</button>`).join('')}
        </div>
      `;
      
      subtopicDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
        btn.onclick = () => {
          subtopicDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.subtopic = btn.dataset.subtopic === 'all' ? null : btn.dataset.subtopic;
          
          let count = 0;
          if (state.subtopic) {
            count = unit.subtopics.find(st => st.subtopicId === state.subtopic).totalQuestions;
          } else {
            count = unit.totalQuestions;
          }
          updateCountButtons(count);
        };
      });
    };

    unitSelectDiv.innerHTML = `
      <div style="margin-bottom:8px;font-weight:500">Select Unit:</div>
      <div class="subtopic-options">
        <button class="subtopic-btn active" data-unit="all">Full Bank</button>
        ${u._data.units.map(un => `<button class="subtopic-btn" data-unit="${un.unitId}">${un.unitName}</button>`).join('')}
      </div>
    `;

    unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
      btn.onclick = () => {
        unitSelectDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.niraliUnitId = btn.dataset.unit === 'all' ? null : parseInt(btn.dataset.unit);
        state.subtopic = null;
        
        if (state.niraliUnitId) {
          const unit = u._data.units.find(un => un.unitId === state.niraliUnitId);
          renderNiraliSubtopics(unit);
          updateCountButtons(unit.totalQuestions);
        } else {
          subtopicDiv.innerHTML = '';
          updateCountButtons(totalQs);
        }
      };
    });

    updateCountButtons(totalQs);
  } else {
    unitSelectDiv.style.display = 'none';
    const syllabus = await loadSyllabus();
    const unitSyllabus = syllabus?.units?.find(x => x.id === unitId);
    
    if (unitSyllabus?.subtopics?.length > 0 && !u.isCollege) {
      subtopicDiv.innerHTML = `
        <div style="margin-bottom:8px;font-weight:500">Select Scope:</div>
        <div class="subtopic-options">
          <button class="subtopic-btn active" data-subtopic="all">Entire Unit</button>
          ${unitSyllabus.subtopics.map(st => `<button class="subtopic-btn" data-subtopic="${st.id}">${st.id} - ${st.title}</button>`).join('')}
        </div>
      `;
      subtopicDiv.style.display = 'block';
      subtopicDiv.querySelectorAll('.subtopic-btn').forEach(btn => {
        btn.onclick = () => {
          subtopicDiv.querySelectorAll('.subtopic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.subtopic = btn.dataset.subtopic === 'all' ? null : btn.dataset.subtopic;
          const subQs = state.subtopic ? u._data.questions.filter(q => q.subtopic === state.subtopic).length : totalQs;
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

function showHome() { showScreen('screen-home'); }

// ── START QUIZ ────────────────────────────────
async function startQuiz() {
  showScreen('screen-loading');

  try {
    const unit = UNITS.find(u => u.id === state.unitId);
    let data = unit?._data;
    if (!data) {
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
      // Handle nested Nirali structure
      if (state.niraliUnitId) {
        const uNode = data.units.find(un => un.unitId === state.niraliUnitId);
        if (state.subtopic) {
          pool = uNode.subtopics.find(st => st.subtopicId === state.subtopic).questions;
        } else {
          pool = uNode.subtopics.flatMap(st => st.questions);
        }
      } else {
        // Entire Nirali Bank
        pool = data.units.flatMap(un => un.subtopics.flatMap(st => st.questions));
      }
    } else {
      pool = data.questions;
      if (state.subtopic) {
        pool = pool.filter(q => q.subtopic === state.subtopic);
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

    // Quiz header badge
    let badgeText = '';
    if (unit?.isCollege) badgeText = 'College MCQ';
    else if (unit?.isNirali) badgeText = 'Nirali Bank';
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
  state.questionStartTime = Date.now(); // Track time

  // Header
  document.getElementById('quiz-qnum').textContent = `Q ${idx + 1} / ${tot}`;
  document.getElementById('score-display').textContent = state.score;

  // Progress bar
  document.getElementById('progress-fill').style.width = `${(idx / tot) * 100}%`;

  // Question card
  document.getElementById('qcard-num').textContent = `Question ${String(idx + 1).padStart(2,'0')}`;
  document.getElementById('qcard-text').textContent = q.question;

  // Shuffle options keeping correct flag
  const opts = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
  state.shuffledOpts = shuffle(opts);

  // Render option buttons
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

  // Hide explanation + next
  const expl = document.getElementById('explanation-card');
  expl.classList.remove('visible');
  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'none';
}

// ── HANDLE ANSWER ─────────────────────────────
function handleAnswer(selectedIdx, clickedBtn) {
  if (state.answered) return;
  state.answered = true;

  // Track time taken
  const timeTaken = (Date.now() - state.questionStartTime) / 1000;
  state.questionTimes.push(timeTaken);

  const q       = state.questions[state.current];
  const correct = state.shuffledOpts[selectedIdx].isCorrect;
  const allBtns = document.querySelectorAll('.option-btn');

  if (correct) {
    state.score++;
    clickedBtn.classList.add('correct');
    // bump score display
    const sv = document.getElementById('score-display');
    sv.textContent = state.score;
    sv.classList.remove('score-bump');
    void sv.offsetWidth; // reflow
    sv.classList.add('score-bump');
  } else {
    clickedBtn.classList.add('wrong');
    // Save mistake for tracking
    const qIdx = state.allQuestions.findIndex(x => x.question === q.question);
    saveMistake(state.unitId, qIdx, q.question);
    // show correct answer
    allBtns.forEach((btn, i) => {
      if (state.shuffledOpts[i].isCorrect) btn.classList.add('correct');
    });
  }

  // Dim unchosen options
  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i !== selectedIdx && !state.shuffledOpts[i].isCorrect) {
      btn.classList.add('dimmed');
    }
  });

  // Show explanation
  document.getElementById('expl-text').textContent = q.explanation;
  document.getElementById('explanation-card').classList.add('visible');

  // Next / Finish button
  const nextBtn = document.getElementById('next-btn');
  const isLast  = state.current === state.questions.length - 1;
  nextBtn.innerHTML = isLast
    ? 'See Results 🎯'
    : 'Next Question <span>→</span>';
  nextBtn.onclick = isLast ? showResults : nextQuestion;
  nextBtn.style.display = 'flex';
}

function nextQuestion() {
  state.current++;
  renderQuestion();
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

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
});
