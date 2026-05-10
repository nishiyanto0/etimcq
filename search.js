/* ═══════════════════════════════════════════
   ETI MCQ Challenge — search.js
   ═══════════════════════════════════════════ */

'use strict';

const SEARCH_CONFIG = {
  FILES: [
    { id: 'unit_1', path: 'data/unit_1.json', label: 'Unit 1' },
    { id: 'unit_2', path: 'data/unit_2.json', label: 'Unit 2' },
    { id: 'unit_3', path: 'data/unit_3.json', label: 'Unit 3' },
    { id: 'unit_4', path: 'data/unit_4.json', label: 'Unit 4' },
    { id: 'unit_5', path: 'data/unit_5.json', label: 'Unit 5' },
    { id: 'college', path: 'data/college_mcq.json', label: 'College' },
    { id: 'nirali', path: 'data/nirali_mcq.json', label: 'Nirali' }
  ],
  MAPPINGS: {
    'iot': 'internet of things',
    'ai': 'artificial intelligence',
    'ml': 'machine learning',
    'dl': 'deep learning',
    'vr': 'virtual reality',
    'ar': 'augmented reality',
    'mr': 'mixed reality',
    'xr': 'extended reality',
    'ngn': 'next generation network',
    'mfa': 'multi-factor authentication',
    'df': 'digital forensics',
    'eh': 'ethical hacking',
    'ncsp': 'national cyber security policy',
    'it act': 'information technology act',
    'ccpwc': 'cyber crime prevention against women and children',
    'dpdp': 'digital personal data protection',
    'cert-in': 'computer emergency response team india'
  },
  TOPIC_UNITS: {
    'ai': 1, 'artificial intelligence': 1, 'ml': 1, 'machine learning': 1, 'dl': 1, 'deep learning': 1, 'generative ai': 1, 'gen ai': 1, 'gpt': 1, 'transformer': 1,
    'iot': 2, 'internet of things': 2, '5g': 2, 'sensor': 2, 'actuator': 2, 'ngn': 2, 'media gateway': 2,
    'blockchain': 3, 'crypto': 3, 'bitcoin': 3, 'ethereum': 3, 'smart contract': 3, 'consensus': 3, 'mining': 3,
    'ar': 4, 'vr': 4, 'mr': 4, 'xr': 4, 'augmented reality': 4, 'virtual reality': 4, 'mixed reality': 4, 'extended reality': 4, 'green computing': 4, 'quantum': 4, 'haptic': 4, 'metaverse': 4,
    'forensics': 5, 'hacking': 5, 'hacker': 5, 'it act': 5, 'cyber law': 5, 'digital forensics': 5, 'ethical hacking': 5, 'ncsp': 5, 'ccpwc': 5
  }
};

let allQuestions = [];
let fuse = null; // We'll implement a simple search instead of Fuse.js for simplicity as requested

// Initialize
async function init() {
  const resultsContainer = document.getElementById('results-grid');
  const statsContainer = document.getElementById('search-stats');
  
  try {
    // Show loader
    resultsContainer.innerHTML = `
      <div class="loading-wrap">
        <div class="loader"></div>
        <p style="margin-top:20px; color:var(--text-muted)">Indexing questions...</p>
      </div>
    `;

    // Fetch all files
    const allData = await Promise.all(
      SEARCH_CONFIG.FILES.map(async file => {
        try {
          const r = await fetch(file.path);
          const json = await r.json();
          return { file, questions: json.questions };
        } catch (e) {
          console.error(`Failed to load ${file.path}:`, e);
          return { file, questions: [] };
        }
      })
    );

    // Flatten into one array
    allQuestions = [];
    allData.forEach(source => {
      source.questions.forEach(q => {
        allQuestions.push({
          ...q,
          sourceLabel: source.file.label,
          sourceId: source.file.id
        });
      });
    });

    statsContainer.textContent = `Ready! Indexed ${allQuestions.length} questions across all sources.`;
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Start searching...</h2>
        <p>Try keywords like "AI", "IoT", "Forensics", or "Cyber Law"</p>
      </div>
    `;

    // Setup search listener
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
  } catch (e) {
    resultsContainer.innerHTML = `<p style="color:var(--accent)">Error loading data: ${e.message}</p>`;
  }
}

// Smart Search Logic
function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const resultsContainer = document.getElementById('results-grid');
  const statsContainer = document.getElementById('search-stats');

  if (query.length < 2) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Start searching...</h2>
        <p>Try keywords like "AI", "IoT", "Forensics", or "Cyber Law"</p>
      </div>
    `;
    statsContainer.textContent = `Indexed ${allQuestions.length} questions.`;
    return;
  }

  // Expansion logic
  const searchTerms = [query];
  
  // Check if query is an abbreviation
  if (SEARCH_CONFIG.MAPPINGS[query]) {
    searchTerms.push(SEARCH_CONFIG.MAPPINGS[query]);
  }
  
  // Check if query contains a full form that has an abbreviation
  for (const [abbr, full] of Object.entries(SEARCH_CONFIG.MAPPINGS)) {
    if (query === full || query.includes(full)) {
      searchTerms.push(abbr);
    }
  }

  // Detect target unit from syllabus topics
  let targetUnit = null;
  searchTerms.forEach(term => {
    for (const [topic, unit] of Object.entries(SEARCH_CONFIG.TOPIC_UNITS)) {
      if (term.includes(topic)) {
        targetUnit = unit;
        break;
      }
    }
  });

  // Filter with Scoring
  const results = allQuestions.map(q => {
    let score = 0;
    const qText = q.question.toLowerCase();
    const optionsText = q.options.join(' ').toLowerCase();
    const explText = (q.explanation || '').toLowerCase();
    
    // 1. Tag Boost (Highest Precision)
    if (q.tags && q.tags.length > 0) {
      searchTerms.forEach(term => {
        if (q.tags.includes(term)) {
          score += 1000; // Total dominance for tagged questions
        }
      });
    }

    // 2. Syllabus Unit Boost
    const qUnit = getQuestionUnit(q);
    if (targetUnit && qUnit === targetUnit) {
      score += 150; 
    }

    searchTerms.forEach((term, idx) => {
      const weight = idx === 0 ? 1 : 0.8; // Primary term gets higher weight
      const isShort = term.length < 4; // Stricter threshold: only allow includes() for 4+ chars
      const isMapping = !!SEARCH_CONFIG.MAPPINGS[term];
      
      // Word boundary regex (\b) is the gold standard for precision
      const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
      
      // Question Text
      if (wordRegex.test(qText)) score += 100 * weight;
      else if (!isShort && !isMapping && qText.includes(term)) score += 40 * weight;
      
      // Options
      if (wordRegex.test(optionsText)) score += 60 * weight;
      else if (!isShort && !isMapping && optionsText.includes(term)) score += 20 * weight;
      
      // Explanations
      if (wordRegex.test(explText)) score += 30 * weight;
      else if (!isShort && !isMapping && explText.includes(term)) score += 10 * weight;
    });

    return { ...q, searchScore: score };
  })
  .filter(q => q.searchScore > 0)
  .sort((a, b) => b.searchScore - a.searchScore);

  renderResults(results, query, searchTerms);
  
  if (results.length > 0) {
    statsContainer.innerHTML = `
      <span>Found ${results.length} matches for "${query}"</span>
      <button class="btn-practice-all" onclick="startPracticeSession()">
        Practice These Questions 🎯
      </button>
    `;
    window._currentResults = results;
  } else {
    statsContainer.textContent = `No matches found for "${query}"`;
  }
}

function startPracticeSession() {
  if (!window._currentResults || window._currentResults.length === 0) return;
  
  // Save to localStorage for game.js to pick up
  const sessionData = {
    type: 'search_practice',
    query: document.getElementById('search-input').value,
    questions: window._currentResults.slice(0, 50), // Limit to 50 for performance
    timestamp: Date.now()
  };
  
  localStorage.setItem('ETI_SEARCH_PRACTICE', JSON.stringify(sessionData));
  window.location.href = 'index.html?mode=search';
}

function renderResults(questions, originalQuery, expandedTerms) {
  const resultsContainer = document.getElementById('results-grid');
  
  if (questions.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😕</div>
        <h2>No matches found</h2>
        <p>Try different keywords or check for typos.</p>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = questions.map((q, idx) => {
    // Highlight terms
    let highlightedQuestion = q.question;
    expandedTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedQuestion = highlightedQuestion.replace(regex, '<span class="highlight">$1</span>');
    });

    return `
      <div class="q-card" style="animation-delay: ${idx * 0.05}s">
        <div class="q-meta">
          <span class="badge badge-source">${q.sourceLabel}</span>
          <span class="badge badge-unit">Unit ${q.unit || q.sourceId.replace('unit_', '')}</span>
          ${q.subtopic ? `<span class="badge badge-sub">${q.subtopic}</span>` : ''}
          <span class="match-score">Relevance: ${Math.round(q.searchScore)}</span>
        </div>
        <div class="q-text">${highlightedQuestion}</div>
        <div class="options-list">
          ${q.options.map((opt, oIdx) => {
            const isCorrect = oIdx === q.correct;
            return `
              <div class="opt-item ${isCorrect ? 'correct' : ''}">
                <div class="opt-marker">${String.fromCharCode(65 + oIdx)}</div>
                <span>${opt}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="q-actions">
          <button class="expl-toggle" onclick="toggleExpl(this)">
            <span>💡</span> Show Explanation
          </button>
          <button class="btn-mini-practice" onclick="practiceQuestion(${idx})">
            Test Me 🎯
          </button>
        </div>
        <div class="expl-content">
          ${q.explanation || 'No explanation available.'}
        </div>
      </div>
    `;
  }).join('');
}

window.practiceQuestion = (idx) => {
  const q = window._currentResults[idx];
  const sessionData = {
    type: 'search_practice',
    query: `Question: ${q.question.substring(0, 20)}...`,
    questions: [q],
    timestamp: Date.now()
  };
  localStorage.setItem('ETI_SEARCH_PRACTICE', JSON.stringify(sessionData));
  window.location.href = 'index.html?mode=search';
};

window.startPracticeSession = startPracticeSession;

// UI Helpers
window.toggleExpl = (btn) => {
  const card = btn.closest('.q-card');
  const content = card.querySelector('.expl-content');
  const isHidden = content.style.display !== 'block';
  content.style.display = isHidden ? 'block' : 'none';
  btn.querySelector('span').textContent = isHidden ? '📖' : '💡';
  btn.lastChild.textContent = isHidden ? ' Hide Explanation' : ' Show Explanation';
};

function getQuestionUnit(q) {
  if (q.sourceId && q.sourceId.startsWith('unit_')) return parseInt(q.sourceId.replace('unit_', ''));
  if (q.unit) return parseInt(q.unit);
  if (q.subtopic && typeof q.subtopic === 'string') {
    const match = q.subtopic.match(/^(\d)\./);
    if (match) return parseInt(match[1]);
  }
  return null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Start
document.addEventListener('DOMContentLoaded', init);

