// ══════════════════════════════════════════════════════
//  LEADERBOARD v2 — full drop-in for game.js
//  Replace the old renderLeaderboard() + formatTime() block.
//  Also paste the modal HTML into index.html (see bottom).
// ══════════════════════════════════════════════════════

// ── SCORING ENGINE ────────────────────────────────────
// Key: "playerName|unitId|subtopic" → average acc across attempts
// Combined score = sum of avg-acc per unique (unit+subtopic) bucket
// Retrying same subtopic just updates the average — no exploit possible

function buildPlayerProfiles(scores) {
  const profiles = {}; // { playerName: { buckets, allAttempts } }

  scores.forEach(s => {
    const name = s.playerName || 'Anonymous';
    if (!profiles[name]) {
      profiles[name] = { name, buckets: {}, allAttempts: [] };
    }
    const p = profiles[name];
    p.allAttempts.push(s);

    // bucket key = unitId + subtopic (null subtopic = whole unit)
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

  // Compute per-bucket avg + combined score per player
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

  // ── RECENT ───────────────────────────────────────────
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

  // ── BY PLAYER ─────────────────────────────────────────
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

  // ── BY UNIT ───────────────────────────────────────────
  } else if (tab === 'unit') {
    const byUnit = {};
    scores.forEach(s => {
      const key = s.unitId;
      if (!byUnit[key]) byUnit[key] = [];
      byUnit[key].push(s);
    });

    // Per unit: rank players by their avg acc in that unit
    const sections = Object.entries(byUnit)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([unitId, arr]) => {
        const unitName = arr[0].unitName || unitLabelFromId(unitId);

        // Group by player within this unit, avg their scores
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

        // Subtopic breakdown
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

  // ── TOP SCORES (combined, deduped) ────────────────────
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

  // Build bucket rows sorted by avgAcc desc
  const bucketRows = Object.values(p.buckets)
    .sort((a, b) => b.avgSmart - a.avgSmart)
    .map(b => {
      const attRows = b.attempts
        .sort((a, b) => b.date - a.date) // most recent first
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
  document.getElementById('player-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close on backdrop click
document.addEventListener('click', e => {
  const modal = document.getElementById('player-modal');
  if (modal && e.target === modal) closePlayerModal();
});
