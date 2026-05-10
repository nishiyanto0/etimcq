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
    'cert-in': 'computer emergency response team india',
    'cert': 'cert-in',
    'wifi': '802.11',
    'wi-fi': '802.11',
    '802.11': 'wifi',
    'zigbee': '802.15.4',
    '802.15.4': 'zigbee',
    'bluetooth': '802.15.1',
    'pow': 'proof of work',
    'pos': 'proof of stake',
    'consensus': 'proof of work, proof of stake',
    'crypto': 'bitcoin, ethereum, cryptocurrency',
    'hacker': 'white hat, black hat, grey hat',
    'hacking': 'penetration testing, ethical hacking',
    'phishing': 'social engineering',
    'ransomware': 'malware',
    'waf': 'web application firewall',
    'zero-day': 'vulnerability'
  },
  TOPIC_UNITS: {
    'ai': 1, 'artificial intelligence': 1, 'ml': 1, 'machine learning': 1, 'dl': 1, 'deep learning': 1, 'gen ai': 1, 'gpt': 1, 'transformer': 1, 'gan': 1, 'neural': 1, 'supervised': 1, 'unsupervised': 1, 'reinforcement': 1,
    'iot': 2, 'internet of things': 2, '5g': 2, 'sensor': 2, 'actuator': 2, 'ngn': 2, 'gateway': 2, '802.11': 2, 'wifi': 2, 'zigbee': 2, '802.15.4': 2, 'mqtt': 2, 'coap': 2, 'ipv6': 2, 'lowpan': 2,
    'blockchain': 3, 'crypto': 3, 'bitcoin': 3, 'ethereum': 3, 'smart contract': 3, 'consensus': 3, 'mining': 3, 'miner': 3, 'decentralized': 3, 'distributed ledger': 3, 'dlt': 3, 'immutability': 3, 'transparency': 3,
    'ar': 4, 'vr': 4, 'mr': 4, 'xr': 4, 'augmented reality': 4, 'virtual reality': 4, 'mixed reality': 4, 'extended reality': 4, 'green computing': 4, 'quantum': 4, 'haptic': 4, 'metaverse': 4, 'qubit': 4, 'superposition': 4, 'entanglement': 4, 'e-waste': 4,
    'forensics': 5, 'hacking': 5, 'hacker': 5, 'it act': 5, 'cyber law': 5, 'digital forensics': 5, 'ethical hacking': 5, 'ncsp': 5, 'ccpwc': 5, 'phishing': 5, 'ransomware': 5, 'waf': 5, 'zero-day': 5, 'custody': 5, 'hash': 5, 'carving': 5, 'volatile': 5, 'dfrws': 5, 'adfm': 5, 'idip': 5, 'ceh': 5, 'oscp': 5
  },
  SEMANTIC_GROUPS: {
    'sensor': [
      'dht11', 'dht22', 'lm35', 'ldr', 'pir', 'mq-2', 'mq-135',
      'bmp180', 'bmp280', 'ultrasonic sensor', 'flame sensor',
      'soil moisture sensor', 'capacitive sensor', 'load cell',
      'accelerometer', 'gyroscope', 'sound sensor', 'ir sensor',
      'hall effect sensor', 'photodiode', 'flow sensor',
      'water level sensor', 'vibration sensor', 'thermistor',
      'gps', 'rfid'
    ],
    'actuator': [
      'relay', 'dc motor', 'servo motor', 'stepper motor',
      'solenoid valve', 'buzzer', 'electric door lock', 'water pump'
    ],
    'microcontroller': [
      'arduino', 'raspberry pi', 'esp8266', 'esp32',
      'nodemcu', 'atmega', 'pic'
    ],
    'protocol': [
      'mqtt', 'coap', 'http', 'https', 'tcp', 'udp', 'websocket',
      'xmpp', 'amqp', 'dds', 'ieee 802.3', 'ieee 802.11',
      'ieee 802.15.4', 'ieee 802.16', 'wi-fi', 'bluetooth', 'ble',
      'zigbee', 'ipv4', 'ipv6'
    ],
    '5g': [
      'mmtc', 'urllc', 'embb', 'network slicing', 'beamforming',
      'qos', 'lpwan', 'lorawan', 'nb-iot', 'sigfox', 'lte-m'
    ],
    'network': [
      'ngn', 'next generation network', 'media gateway',
      'media gateway controller', 'application server',
      '5g', '4g', '3g', '2g', 'lte'
    ],
    'cloud': [
      'edge computing', 'fog computing', 'cloud computing',
      'paas', 'iaas', 'saas', 'iot gateway'
    ],
    'port': [
      'port 80', 'port 22', 'port 23', 'port 21',
      'port 443', 'port 25', 'port 110', 'port 3306'
    ],
    'consensus': [
      'proof of work', 'proof of stake', 'pow', 'pos',
      'pbft', 'delegated proof of stake', 'dpos'
    ],
    'wallet': [
      'hot wallet', 'cold wallet', 'hardware wallet',
      'metamask', 'ledger', 'private key', 'public key'
    ]
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

  // Semantic group expansion (both directions)
  for (const [groupName, members] of Object.entries(SEARCH_CONFIG.SEMANTIC_GROUPS)) {
    // Forward: user typed "sensor" → add all sensor component names
    if (query === groupName || searchTerms.includes(groupName)) {
      members.forEach(m => {
        if (!searchTerms.includes(m)) searchTerms.push(m);
      });
    }
    // Reverse: user typed "dht11" → also search for "sensor"
    if (members.some(m => query === m || query.includes(m))) {
      if (!searchTerms.includes(groupName)) searchTerms.push(groupName);
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
  // Filter with Scoring
  const results = allQuestions.map(q => {
    let keywordScore = 0;
    const qText = q.question.toLowerCase();
    const optionsText = q.options.join(' ').toLowerCase();
    
    // 1. Tag Match (Highest Precision)
    if (q.tags && q.tags.length > 0) {
      searchTerms.forEach(term => {
        if (q.tags.includes(term)) {
          keywordScore += 1000; 
        }
      });
    }

    // 2. Keyword Match Loop — WORD BOUNDARY ONLY, NO SUBSTRING FALLBACK
    searchTerms.forEach((term, idx) => {
      const weight = idx === 0 ? 1 : 0.8;
      const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
      
      // Question — strict word boundary only
      if (wordRegex.test(qText)) keywordScore += 100 * weight;
      
      // Options — strict word boundary only
      if (wordRegex.test(optionsText)) keywordScore += 60 * weight;
    });

    // 3. Syllabus Unit Boost (Only for ranking, not for qualification)
    let totalScore = keywordScore;
    const qUnit = getQuestionUnit(q);
    if (keywordScore > 0 && targetUnit && qUnit === targetUnit) {
      totalScore += 150; 
    }

    return { ...q, searchScore: totalScore, hasKeywordMatch: keywordScore > 0 };
  })
  .filter(q => q.hasKeywordMatch)
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
    // Highlight terms with word boundary awareness
    let highlightedQuestion = q.question;
    expandedTerms.forEach(term => {
      const isShort = term.length < 4;
      // If short (like AR), only highlight standalone words. If long, highlight anywhere.
      const regex = isShort ? new RegExp(`\\b(${term})\\b`, 'gi') : new RegExp(`(${term})`, 'gi');
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

