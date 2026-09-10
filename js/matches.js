let currentLeague = 'all';
let currentMonth = 'all';
let currentMatchView = 'upcoming';

function getTeamCrest(name) { return CONFIG.TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }

function parseMatchDateTime(dateStr, timeStr = "20:00") {
  if (!dateStr) return new Date(2099, 0, 1);
  let d=1, m=1, y=2026;
  if (dateStr.includes('/')) { const p = dateStr.split('/'); d = parseInt(p[0]); m = parseInt(p[1]); y = parseInt(p[2]); }
  else if (dateStr.includes('-')) { const p = dateStr.split('-'); y = parseInt(p[0]); m = parseInt(p[1]); d = parseInt(p[2]); }
  return new Date(y, m - 1, d, 20, 0, 0);
}

function hasMatchStarted(dateStr, timeStr) { return new Date() >= parseMatchDateTime(dateStr, timeStr); }

function calcPts(pred, score) {
  if (!pred || pred.h==='' || pred.a==='' || !score) return 0;
  if (pred.h===score.h && pred.a===score.a) return 5;
  const pR = pred.h>pred.a?'H':pred.h<pred.a?'A':'D';
  const sR = score.h>score.a?'H':score.h<score.a?'A':'D';
  return pR===sR?3:0;
}

function recalculateAllCloudPoints() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds || {})) { const s = appState.scores[id]; if (s && s.status!=='LIVE') t += calcPts(p, s); }
    u.points = t;
  });
}

function getUserStats(u) {
  let ex=0, co=0;
  for (const [id, p] of Object.entries(u.preds || {})) {
    const s = appState.scores[id];
    if (s && s.status!=='LIVE') { const pts = calcPts(p, s); if (pts===5) ex++; else if (pts===3) co++; }
  }
  return { exact:ex, correct:co, total:Object.keys(u.preds||{}).length };
}

function getSorted() { return [...appState.users].sort((a,b) => b.points - a.points); }

function setupMonthFilter() {
  const d = new Date(); currentMonth = (d.getMonth() + 1).toString().padStart(2, '0');
  const bar = document.getElementById('monthFilterBar'); if (!bar) return;
  const months = [{val:'all', lbl:'Toute l\'année'}, {val:'08',lbl:'Août'}, {val:'09',lbl:'Sept.'}, {val:'10',lbl:'Oct.'}, {val:'11',lbl:'Nov.'}, {val:'12',lbl:'Déc.'}, {val:'01',lbl:'Janv.'}, {val:'02',lbl:'Févr.'}, {val:'03',lbl:'Mars'}, {val:'04',lbl:'Avril'}, {val:'05',lbl:'Mai'}];
  bar.innerHTML = months.map(mo => `<button class="matchday-pill ${mo.val === currentMonth?'active':''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`).join('');
}

function filterByMonth(m) { currentMonth = m; document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }
function filterLeague(l) { currentLeague = l; applyTheme(); document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }
function switchMatchView(viewMode) { currentMatchView = viewMode; document.getElementById('btnTabUpcoming').className = viewMode === 'upcoming' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'; document.getElementById('btnTabFinished').className = viewMode === 'finished' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'; renderMatches(); }

function toggleMatchPredictions(matchId, matchDateStr) {
  const el = document.getElementById('all_preds_' + matchId); if (!el) return;
  const started = hasMatchStarted(matchDateStr, "20:00");
  const isAdmin = (currentUser && currentUser.role === 'admin');

  if (el.style.display === 'none') {
    if (!started && !isAdmin) { alert("🔒 Anti-Triche : Les pronostics de vos amis seront visibles dès le coup d'envoi du match !"); return; }
    const score = appState.scores[matchId];
    let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Pronostics des joueurs :</div>';
    let count = 0;
    appState.users.sort((a,b)=>b.points-a.points).forEach(u => {
      const pred = u.preds && u.preds[matchId];
      if (pred && pred.h !== '' && pred.a !== '') {
        count++;
        let resLbl = '';
        if (score && score.status !== 'LIVE') { const pts = calcPts(pred, score); resLbl = `<span class="${pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong'}" style="margin-left:auto;font-weight:bold">(+${pts} pts)</span>`; }
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem"><span style="flex:1"><strong>${u.username}</strong></span><span style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold">${pred.h} - ${pred.a}</span>${resLbl}</div>`;
      }
    });
    if (count === 0) html += '<p style="color:var(--text-muted);font-size:0.8rem">Aucun joueur n\'a pronostiqué ce match.</p>';
    el.innerHTML = html; el.style.display = 'block';
  } else { el.style.display = 'none'; }
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;
  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  if (currentMonth !== 'all') { list = list.filter(m => { const parts = m.date.split('/'); return parts.length === 3 && parts[1] === currentMonth; }); }
  if (currentMatchView === 'upcoming') { list = list.filter(m => !appState.scores[m.id] || appState.scores[m.id].status === 'LIVE'); } 
  else { list = list.filter(m => appState.scores[m.id] && appState.scores[m.id].status !== 'LIVE'); }

  const bannerArea = document.getElementById('leagueBannerArea');
  if (currentLeague !== 'all' && CONFIG.LEAGUES[currentLeague]) {
    const li = CONFIG.LEAGUES[currentLeague];
    const bannerImg = (appState.settings.leagueBanners && appState.settings.leagueBanners[currentLeague]) || li.defaultBanner;
    bannerArea.innerHTML = `<div class="league-banner" style="background-image:url('${bannerImg}')"><h2>${li.flag} ${li.name}</h2></div>`;
  } else { bannerArea.innerHTML = ''; }

  if (list.length === 0) { container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">Aucun match trouvé.</p>'; return; }

  let html = '';
  list.forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h:'', a:'' };
    const score = appState.scores[m.id];
    const done = !!score;
    const started = hasMatchStarted(m.date, "20:00");
    const li = CONFIG.LEAGUES[m.league] || { name:m.league, flag:'⚽' };
    let totalPreds = 0; appState.users.forEach(u => { if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPreds++; });

    let statusBadgeHtml = `<span class="status-badge status-upcoming">⏳ 20:00</span>`;
    if (score && score.status === 'LIVE') statusBadgeHtml = `<span class="status-badge status-live">🔴 LIVE ${score.elapsed || 45}'</span>`;
    else if (done) statusBadgeHtml = `<span class="status-badge status-finished">✅ TERMINÉ</span>`;

    let res = '';
    if (done && score) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Score Exact (+5 pts)':pts===3?'✅ Bon Vainqueur (+3 pts)':'❌ Incorrect (0 pt)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    const disableInput = (done) ? 'disabled' : '';

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><div>${statusBadgeHtml} <span style="color:var(--gold);margin-left:8px">📅 ${m.date}</span></div></div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${getTeamCrest(m.home)}" class="team-crest"></div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${getTeamCrest(m.away)}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${!done ? `<div class="match-prediction">
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
  document.querySelectorAll('.match-prediction input').forEach(input => {
    if (!input.disabled) {
      const id = input.id.substring(2);
      const h = document.getElementById('h_' + id)?.value;
      const a = document.getElementById('a_' + id)?.value;
      if (h !== '' && a !== '') { currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) }; count++; }
    }
  });

  if (firestore) { try { await firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch (err) {} }
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  alert(`${count} pronostics enregistrés ! ☁️✅`);
}
