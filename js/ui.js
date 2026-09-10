function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  const authScreen = document.getElementById('authScreen');
  if (authScreen) { authScreen.style.backgroundImage = appState.settings.authBgImage ? `url('${appState.settings.authBgImage}')` : 'none'; authScreen.style.backgroundSize = 'cover'; }
  let bg = appState.settings.bgImage;
  if (currentLeague === 'dashboard' && appState.settings.dashboardBgImage) bg = appState.settings.dashboardBgImage;
  else if (currentLeague !== 'all' && currentLeague !== 'dashboard' && CONFIG.LEAGUES[currentLeague]) { bg = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[currentLeague]) || CONFIG.LEAGUES[currentLeague].defaultBg; }
  document.documentElement.style.setProperty('--bg-image', bg ? `url('${bg}')` : 'none');
}

function updateUI() {
  if (!currentUser) return;
  document.getElementById('navPoints').textContent = (currentUser.points || 0) + ' pts';
  const navAv = document.getElementById('navAvatar');
  if (currentUser.avatar) { navAv.textContent = ''; navAv.style.backgroundImage = `url('${currentUser.avatar}')`; navAv.style.backgroundSize = 'cover'; } 
  else { navAv.style.backgroundImage = 'none'; navAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  
  const st = getUserStats(currentUser);
  document.getElementById('statPoints').textContent = currentUser.points || 0;
  document.getElementById('statPredictions').textContent = st.total;
  document.getElementById('statExact').textContent = st.exact;
  
  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  const rankStr = rankIdx >= 0 ? '#' + (rankIdx + 1) : '#1';
  document.getElementById('statRank').textContent = rankStr;
  
  document.getElementById('profileUsername').textContent = currentUser.username || '-';
  document.getElementById('profileEmail').textContent = currentUser.email || '-';
  document.getElementById('profileRole').textContent = currentUser.role === 'admin' ? '⭐ Administrateur' : '🎮 Joueur';
  document.getElementById('profilePoints').textContent = currentUser.points || 0;
  document.getElementById('profileRank').textContent = rankStr;

  const profAv = document.getElementById('profileBigAvatar');
  if (profAv) {
    if (currentUser.avatar) { profAv.textContent = ''; profAv.style.backgroundImage = `url('${currentUser.avatar}')`; profAv.style.backgroundSize = 'cover'; } 
    else { profAv.style.backgroundImage = 'none'; profAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  }

  if (sorted[0]) {
    document.getElementById('kingUsername').textContent = sorted[0].username;
    document.getElementById('kingPoints').textContent = sorted[0].points + ' pts';
  }
}

function renderDashboardLeaderboard() {
  const sorted = getSorted(); const max = sorted[0]?.points || 1; let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'rgba(0,230,118,0.1)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px"><span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span><div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${u.username} ${u.role==='admin'?'⭐':''}</div><div style="height:4px;background:var(--bg-body);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div></div><span style="font-weight:800;color:var(--gold)">${u.points} pts</span></div>`;
  });
  document.getElementById('dashboardLeaderboard').innerHTML = html;
}

function renderLeaderboard() {
  const sorted = getSorted();
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅ Exact</th><th>🎯 Bon</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const st = getUserStats(u);
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    html += `<tr class="${isMe?'current-user':''}"><td>${medal}</td><td><strong>${u.username}</strong> ${u.role==='admin'?'⭐':''}</td><td>${st.total}</td><td style="color:var(--gold);font-weight:bold">${st.exact}</td><td style="color:var(--green);font-weight:bold">${st.correct}</td><td style="font-size:1.1rem;font-weight:800">${u.points} pts</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

function renderMyPredictions() {
  const container = document.getElementById('myPredictionsList');
  if (!container || !currentUser) return;
  let html = '', count = 0;
  for (const [id, pred] of Object.entries(currentUser.preds || {})) {
    const match = ALL_MATCHES.find(m => m.id === id);
    if (!match) continue;
    count++;
    const score = appState.scores[id];
    let statusText = `<span style="color:var(--gold)">⏳ En attente</span>`;
    if (score && score.status !== 'LIVE') {
      const pts = calcPts(pred, score);
      statusText = `<span class="${pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong'}">Final: ${score.h}-${score.a} (+${pts} pts)</span>`;
    }
    html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem"><div style="flex:1"><strong>${match.home}</strong> vs <strong>${match.away}</strong></div><div style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold;margin:0 10px">${pred.h} - ${pred.a}</div><div style="min-width:120px;text-align:right">${statusText}</div></div>`;
  }
  if (count === 0) html = '<p style="text-align:center;color:var(--text-muted)">Vous n\'avez fait aucun pronostic.</p>';
  container.innerHTML = html;
}

function navigateTo(p) {
  if (p === 'admin') { if (!currentUser || currentUser.role !== 'admin') { alert("⛔ Accès refusé ! Réservé à l'administrateur."); return; } }
  if (p === 'dashboard') { currentLeague = 'dashboard'; applyTheme(); } else { currentLeague = 'all'; applyTheme(); }
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  if (p === 'admin') { renderAdminMatchList(); renderAdminLeagueBackgrounds(); renderAdminLeagueBanners(); renderAdminStats(); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
