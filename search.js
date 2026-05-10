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

  // Filter
  const filtered = allQuestions.filter(q => {
    return searchTerms.some(term => {
      const qText = q.question.toLowerCase();
      const optionsText = q.options.join(' ').toLowerCase();
      const explText = (q.explanation || '').toLowerCase();
      const correctText = (q.correctText || '').toLowerCase();
      
      return qText.includes(term) || 
             optionsText.includes(term) || 
             explText.includes(term) || 
             correctText.includes(term);
    });
  });

  renderResults(filtered, query, searchTerms);
  statsContainer.textContent = `Found ${filtered.length} matches for "${query}"`;
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
    let qText = q.question;
    expandedTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      qText = qText.replace(regex, '<span class="highlight">$1</span>');
    });

    return `
      <div class="q-card">
        <div class="q-meta">
          <span class="badge badge-source">${q.sourceLabel}</span>
          <span class="badge badge-unit">Unit ${q.unit || q.sourceId.replace('unit_', '')}</span>
          ${q.subtopic ? `<span class="badge badge-sub">${q.subtopic}</span>` : ''}
        </div>
        <div class="q-text">${qText}</div>
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
        <button class="expl-toggle" onclick="toggleExpl(this)">
          <span>💡</span> Show Explanation
        </button>
        <div class="expl-content">
          ${q.explanation || 'No explanation available.'}
        </div>
      </div>
    `;
  }).join('');
}

// UI Helpers
window.toggleExpl = (btn) => {
  const content = btn.nextElementSibling;
  const isHidden = content.style.display !== 'block';
  content.style.display = isHidden ? 'block' : 'none';
  btn.querySelector('span').textContent = isHidden ? '📖' : '💡';
  btn.lastChild.textContent = isHidden ? ' Hide Explanation' : ' Show Explanation';
};

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
