// ============================================
// FICHIER : js/matches.js
// RÔLE : Affichage des matchs, filtrage, sauvegarde des pronostics
// ============================================

let currentLeague = 'all';
let currentMonth = 'all';
let currentMatchView = 'upcoming';

const TEAM_CRESTS = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Newcastle": "https://media.api-sports.io/football/teams/34.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Atlético Madrid": "https://media.api-sports.io/football/teams/530.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png",
  "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Inter Milan": "https://media.api-sports.io/football/teams/505.png",
  "AC Milan": "https://media.api-sports.io/football/teams/489.png",
  "Juventus": "https://media.api-sports.io/football/teams/496.png",
  "Naples": "https://media.api-sports.io/football/teams/492.png",
  "AS Rome": "https://media.api-sports.io/football/teams/497.png"
};

function getTeamCrest(name) {
  return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`;
}

function parseMatchDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date(2099, 0, 1);
  let d = 1, m = 1, y = 2026;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0]); m = parseInt(parts[1]); y = parseInt(parts[2]);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    y = parseInt(parts[0]); m = parseInt(parts[1]); d = parseInt(parts[2]);
  }
  let hours = 20, minutes = 0;
  if (timeStr && timeStr.includes(':')) {
    const tParts = timeStr.split(':');
    hours = parseInt(tParts[0]); minutes = parseInt(tParts[1]);
  }
  return new Date(y, m - 1, d, hours, minutes, 0);
}

function hasMatchStarted(dateStr, timeStr) {
  const matchTime = parseMatchDateTime(dateStr, timeStr || "20:00");
  if (isNaN(matchTime.getTime())) return false;
  return new Date() >= matchTime;
}

function calcPts(pred, score) {
  if (!pred || pred.h === '' || pred.a === '' || !score) return 0;
  if (pred.h === score.h && pred.a === score.a) return 5;
  const pR = pred.h > pred.a ? 'H' : pred.h < pred.a ? 'A' : 'D';
  const sR = score.h > score.a ? 'H' : score.h < score.a ? 'A' : 'D';
  return pR === sR ? 3 : 0;
}

function recalculateAllCloudPoints() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds || {})) {
      const s = appState.scores[id];
      if (s) t += calcPts(p, s);
    }
    u.points = t;
  });
}

function getUserStats(u) {
  let ex = 0, co = 0;
  for (const [id, p] of Object.entries(u.preds || {})) {
    const s = appState.scores[id];
    if (s) {
      const pts = calcPts(p, s);
      if (pts === 5) ex++;
      else if (pts === 3) co++;
    }
  }
  return { exact: ex, correct: co, total: Object.keys(u.preds || {}).length };
}

function getSorted() {
  return [...appState.users].sort((a, b) => b.points - a.points);
}

function setupMonthFilter() {
  const d = new Date();
  currentMonth = (d.getMonth() + 1).toString().padStart(2, '0');
  const bar = document.getElementById('monthFilterBar');
  if (!bar) return;
  const months = [
    { val: 'all', lbl: 'Toute l\'année' }, { val: '08', lbl: 'Août' }, { val: '09', lbl: 'Sept.' },
    { val: '10', lbl: 'Oct.' }, { val: '11', lbl: 'Nov.' }, { val: '12', lbl: 'Déc.' },
    { val: '01', lbl: 'Janv.' }, { val: '02', lbl: 'Févr.' }, { val: '03', lbl: 'Mars' },
    { val: '04', lbl: 'Avril' }, { val: '05', lbl: 'Mai' }
  ];
  let html = '';
  months.forEach(mo => {
    const isAct = mo.val === currentMonth;
    html += `<button class="matchday-pill ${isAct ? 'active' : ''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`;
  });
  bar.innerHTML = html;
}

function filterByMonth(m) {
  currentMonth = m;
  document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function filterLeague(l) {
  currentLeague = l;
  document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function switchMatchView(viewMode) {
  currentMatchView = viewMode;
  document.getElementById('btnTabUpcoming').className = viewMode === 'upcoming' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  document.getElementById('btnTabFinished').className = viewMode === 'finished' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  renderMatches();
}

function toggleMatchPredictions(matchId, matchDateStr) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;

  const started = hasMatchStarted(matchDateStr, "20:00");
  const isAdmin = (currentUser && currentUser.role === 'admin');

  if (el.style.display === 'none') {
    if (!started && !isAdmin) {
      alert("🔒 Anti-Triche : Les pronostics de vos amis seront visibles dès le coup d'envoi du match !");
      return;
    }

    const score = appState.scores[matchId];
    let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Pronostics des joueurs :</div>';
    let count = 0;
    appState.users.forEach(u => {
      const pred = u.preds && u.preds[matchId];
      if (pred && pred.h !== '' && pred.a !== '') {
        count++;
        let resLbl = '';
        if (score && score.status !== 'LIVE') {
          const pts = calcPts(pred, score);
          resLbl = `<span class="${pts === 5 ? 'pts-exact' : pts === 3 ? 'pts-correct' : 'pts-wrong'}" style="margin-left:auto;font-weight:bold">(+${pts} pts)</span>`;
        }
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem"><span style="flex:1"><strong>${u.username}</strong></span><span style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold">${pred.h} - ${pred.a}</span>${resLbl}</div>`;
      }
    });
    if (count === 0) html += '<p style="color:var(--text-muted);font-size:0.8rem">Aucun joueur n\'a pronostiqué ce match.</p>';
    el.innerHTML = html;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;

  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  if (currentMonth !== 'all') {
    list = list.filter(m => {
      const parts = m.date.split('/');
      return parts.length === 3 && parts[1] === currentMonth;
    });
  }

  // Filtrage par vue (À venir vs Terminés)
  if (currentMatchView === 'upcoming') {
    list = list.filter(m => !appState.scores[m.id] || appState.scores[m.id].status === 'LIVE');
  } else {
    list = list.filter(m => appState.scores[m.id] && appState.scores[m.id].status !== 'LIVE');
  }

  // Bannière
  const bannerArea = document.getElementById('leagueBannerArea');
  if (currentLeague !== 'all' && CONFIG.LEAGUES[currentLeague]) {
    const li = CONFIG.LEAGUES[currentLeague];
    const bannerImg = (appState.settings.leagueBanners && appState.settings.leagueBanners[currentLeague]) || '';
    if (bannerImg) {
      bannerArea.innerHTML = `<div class="league-banner" style="background-image:url('${bannerImg}')"><h2>${li.flag} ${li.name}</h2></div>`;
    } else {
      bannerArea.innerHTML = '';
    }
  } else {
    bannerArea.innerHTML = '';
  }

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">Aucun match trouvé pour cette sélection.</p>';
    return;
  }

  let html = '';
  list.forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h: '', a: '' };
    const score = appState.scores[m.id];
    const matchTimeStr = "20:00";
    const started = hasMatchStarted(m.date, matchTimeStr);
    const isLive = score && score.status === 'LIVE';
    const isFinished = score && score.status === 'FINISHED';
    const li = CONFIG.LEAGUES[m.league] || { name: m.league, flag: '⚽' };

    let totalPreds = 0;
    appState.users.forEach(u => {
      if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPreds++;
    });

    // Badge de statut
    let statusBadgeHtml = `<span class="status-badge status-upcoming">⏳ ${matchTimeStr}</span>`;
    if (isLive) statusBadgeHtml = `<span class="status-badge status-live">🔴 LIVE ${score.elapsed || 45}'</span>`;
    else if (isFinished) statusBadgeHtml = `<span class="status-badge status-finished">✅ TERMINÉ</span>`;

    // Résultat
    let res = '';
    if (isFinished && score) {
      const pts = calcPts(pred, score);
      const cls = pts === 5 ? 'pts-exact' : pts === 3 ? 'pts-correct' : 'pts-wrong';
      const lbl = pts === 5 ? '🎯 Score Exact (+5 pts)' : pts === 3 ? '✅ Bon Vainqueur (+3 pts)' : '❌ Incorrect (0 pt)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    // Verrouillage strict
    const disableInput = (started || isLive || (isFinished && score)) ? 'disabled' : '';
    const lockNotice = (disableInput && !isFinished) ? '<div style="text-align:center;font-size:0.75rem;color:var(--danger);font-weight:bold;margin-bottom:6px">🔒 Pronostics Fermés</div>' : '';

    html += `
      <div class="match-card ${isLive ? 'is-live' : ''} ${isFinished ? 'finished' : ''}">
        <div class="match-header">
          <span>${li.flag} <strong>${li.name}</strong></span>
          <div>${statusBadgeHtml} <span style="color:var(--gold);margin-left:8px">📅 ${m.date}</span></div>
        </div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${getTeamCrest(m.home)}" class="team-crest"></div>
          <div class="match-vs">${(score && (isLive || isFinished)) ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${getTeamCrest(m.away)}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${lockNotice}
        ${(!isFinished || isLive) ? `
        <div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="H" ${disableInput}>
          <span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="A" ${disableInput}>
        </div>` : ''}
        ${res}
        <div style="text-align:center;margin-top:12px;border-top:1px dashed var(--border);padding-top:8px">
          <button class="btn btn-secondary btn-xs" onclick="toggleMatchPredictions('${m.id}', '${m.date}')">👥 Voir les pronos de tous (${totalPreds})</button>
        </div>
        <div id="all_preds_${m.id}" style="display:none;margin-top:10px;padding:10px;background:#111;border-radius:8px;border:1px solid var(--border)"></div>
      </div>`;
  });
  container.innerHTML = html;
}

async function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  const btn = document.getElementById('btnSavePronos');
  if (btn) { btn.innerHTML = "⏳ Sauvegarde..."; btn.disabled = true; }

  document.querySelectorAll('.match-prediction input').forEach(input => {
    if (!input.disabled) {
      const id = input.id.substring(2);
      const h = document.getElementById('h_' + id)?.value;
      const a = document.getElementById('a_' + id)?.value;
      if (h !== '' && a !== '') {
        currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) };
        count++;
      }
    }
  });

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;

  if (firestore) {
    try {
      await firestore.collection('users').doc(currentUser.id).set({ preds: currentUser.preds }, { merge: true });
    } catch (err) {}
  }

  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();

  if (btn) {
    btn.innerHTML = "✅ " + count + " Sauvegardés";
    btn.disabled = false;
    setTimeout(() => { btn.innerHTML = "💾 Sauvegarder Mes Pronos"; }, 2000);
  }
}