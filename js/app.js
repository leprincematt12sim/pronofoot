// === CONFIGURATION SUPABASE ET API ===
const SUPABASE_URL = "https://ktcsrjyuzbjnhkkglwcm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y3Nyanl1emJqbmhra2dsd2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjA2MjIsImV4cCI6MjEwNDYzNjYyMn0.6MkmXkU-ArSogrci6YJi2QiSpT-TzR83Za9Qa0EpLHk";
const REAL_API_KEY = "5eb745d2e42b3f1e72fddff81191592e";

let supabase = null;
try { if (window.supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){ console.error(e); }

const TEAM_CRESTS = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png", "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png", "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png", "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png", "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png", "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png", "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png"
};

const LEAGUE_INFO = {
  champions:{ name:'Ligue des Champions', flag:'🏆', accent:'#f5c518', defaultBanner:'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', defaultBg:'' },
  premier:{ name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent:'#3d195b', defaultBanner:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80', defaultBg:'' },
  laliga:{ name:'La Liga', flag:'🇪🇸', accent:'#ee8707', defaultBanner:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', defaultBg:'' },
  seriea:{ name:'Serie A', flag:'🇮🇹', accent:'#024494', defaultBanner:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1200&q=80', defaultBg:'' },
  bundesliga:{ name:'Bundesliga', flag:'🇩🇪', accent:'#d20515', defaultBanner:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1200&q=80', defaultBg:'' },
  ligue1:{ name:'Ligue 1', flag:'🇫🇷', accent:'#091c3e', defaultBanner:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80', defaultBg:'' }
};
const AVATAR_COLORS = ['#00E676','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'];

let appState = {
  users: JSON.parse(localStorage.getItem('pf_users')) || [{ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} }],
  scores: JSON.parse(localStorage.getItem('pf_scores')) || {},
  settings: JSON.parse(localStorage.getItem('pf_settings')) || { themeColor: '#00E676', authBgImage: '', dashboardBgImage: '', bgImage: '', leagueBanners: {}, leagueBackgrounds: {}, playlist: [], announce: '' }
};

let currentUser = JSON.parse(localStorage.getItem('pf_session')) || null;
let currentLeague = 'all';
let currentMatchView = 'upcoming';
let leaderboardFilter = 'all';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }
function getAvatarColor(u) { return AVATAR_COLORS[(u||'A').charCodeAt(0)%AVATAR_COLORS.length]; }

// SECRET ADMIN UNLOCK (Clic 5 fois sur le Logo)
let secretClicks = 0;
function secretAdminUnlock() {
  secretClicks++;
  if (secretClicks >= 5 && currentUser) {
    currentUser.role = 'admin';
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].role = 'admin';
    localStorage.setItem('pf_session', JSON.stringify(currentUser));
    saveDataToCloud();
    alert('🔓 PASS VIP ADMIN ACTIVÉ !');
    checkAdminAccess();
    secretClicks = 0;
  }
}

// ------------------------------------------
// 🕰️ GESTION DES DATES ET VERROUILLAGES
// ------------------------------------------
function parseMatchDateTime(dateStr, timeStr = "20:00") {
  if (!dateStr) return new Date(2099, 0, 1);
  let d=1, m=1, y=2026;
  if (dateStr.includes('/')) { const p = dateStr.split('/'); d = parseInt(p[0]); m = parseInt(p[1]); y = parseInt(p[2]); }
  else if (dateStr.includes('-')) { const p = dateStr.split('-'); y = parseInt(p[0]); m = parseInt(p[1]); d = parseInt(p[2]); }
  let h=20, min=0;
  if (timeStr && timeStr.includes(':')) { const tp = timeStr.split(':'); h = parseInt(tp[0]); min = parseInt(tp[1]); }
  return new Date(y, m - 1, d, h, min, 0);
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

function getUserStats(u, leagueFilter = 'all') {
  let ex=0, co=0, wr=0;
  let totalMatches = 0;
  
  for (const [id, p] of Object.entries(u.preds || {})) {
    const s = appState.scores[id];
    // Optionnel: filtrer par ligue si besoin
    if (s && s.status!=='LIVE') {
      totalMatches++;
      const pts = calcPts(p, s);
      if (pts===5) ex++; else if (pts===3) co++; else wr++;
    }
  }
  let winRate = totalMatches > 0 ? (((ex + co) / totalMatches) * 100).toFixed(0) : 0;
  let exactRate = totalMatches > 0 ? ((ex / totalMatches) * 100).toFixed(0) : 0;
  let totalPoints = (ex * 5) + (co * 3);
  return { exact:ex, correct:co, wrong:wr, total:Object.keys(u.preds||{}).length, winRate, exactRate, points:totalPoints };
}

function getSorted(leagueFilter = 'all') {
  if (leagueFilter === 'all') return [...appState.users].sort((a,b) => b.points - a.points);
  
  // Tri par championnat spécifique
  return [...appState.users].map(u => {
    let pts = 0;
    for (const [id, p] of Object.entries(u.preds || {})) {
      const match = ALL_MATCHES.find(m => m.id === id);
      if (match && match.league === leagueFilter) {
        const s = appState.scores[id];
        if (s && s.status!=='LIVE') pts += calcPts(p, s);
      }
    }
    return { ...u, leaguePts: pts };
  }).sort((a,b) => b.leaguePts - a.leaguePts);
}

// ------------------------------------------
// ☁️ SYNCHRONISATION SUPABASE
// ------------------------------------------
async function fetchSupabaseData() {
  if (!supabase) return;
  try {
    const { data: profiles, error: errProf } = await supabase.from('profiles').select('*');
    if (!errProf && profiles) { appState.users = profiles; localStorage.setItem('pf_users', JSON.stringify(appState.users)); }
    
    const { data: set, error: errSet } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
    if (!errSet && set) {
      appState.scores = set.scores || {};
      appState.settings.bgImage = set.bg_image || '';
      appState.settings.themeColor = set.theme_color || '#00E676';
      appState.settings.announce = set.announce || '';
      appState.settings.leagueBanners = set.league_banners || {};
      appState.settings.leagueBackgrounds = set.league_backgrounds || {};
      localStorage.setItem('pf_scores', JSON.stringify(appState.scores));
      localStorage.setItem('pf_settings', JSON.stringify(appState.settings));
    }
    recalculateAllCloudPoints();
    if (currentUser) { const u = appState.users.find(x => x.id === currentUser.id); if (u) currentUser = u; }
    updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
    if (currentUser?.role === 'admin') { renderAdminMatchList(); renderAdminLeagueBackgrounds(); renderAdminLeagueBanners(); renderAdminStats(); }
  } catch(e) {}
}

async function saveDataToCloud() {
  localStorage.setItem('pf_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_scores', JSON.stringify(appState.scores));
  localStorage.setItem('pf_settings', JSON.stringify(appState.settings));
  
  if (!supabase) return;
  try {
    if (currentUser) {
      await supabase.from('profiles').upsert({
        id: currentUser.id, username: currentUser.username, email: currentUser.email, pass: currentUser.pass,
        role: currentUser.role, points: currentUser.points, avatar: currentUser.avatar, preds: currentUser.preds
      });
    }
    if (currentUser?.role === 'admin') {
      await supabase.from('app_settings').upsert({
        id: 'global', scores: appState.scores, announce: appState.settings.announce, 
        bg_image: appState.settings.bgImage, theme_color: appState.settings.themeColor,
        league_banners: appState.settings.leagueBanners, league_backgrounds: appState.settings.leagueBackgrounds
      });
    }
  } catch(e) {}
}

// ------------------------------------------
// 🖼️ COMPRESSION IMAGES (Canvas)
// ------------------------------------------
function compressImage(file, maxWidth, quality, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width, height = img.height;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadUserAvatar(event) {
  compressImage(event.target.files[0], 150, 0.5, dataUrl => {
    currentUser.avatar = dataUrl;
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].avatar = dataUrl;
    localStorage.setItem('pf_session', JSON.stringify(currentUser));
    saveDataToCloud(); updateUI(); renderLeaderboard(); renderDashboardLeaderboard();
    alert("✅ Photo de profil mise à jour !");
  });
}
function uploadAuthBgFromFile(event) { compressImage(event.target.files[0], 800, 0.4, d => { appState.settings.authBgImage = d; applyTheme(); saveDataToCloud(); alert("✅ Fond Connexion OK !"); }); }
function uploadDashboardBgFromFile(event) { compressImage(event.target.files[0], 800, 0.4, d => { appState.settings.dashboardBgImage = d; applyTheme(); saveDataToCloud(); alert("✅ Fond Accueil OK !"); }); }
function uploadAdminLeagueImage(event, type, leagueKey) {
  compressImage(event.target.files[0], 800, 0.4, d => {
    if (!appState.settings[type]) appState.settings[type] = {};
    appState.settings[type][leagueKey] = d;
    saveDataToCloud(); applyTheme(); renderMatches(); renderAdminLeagueBackgrounds(); renderAdminLeagueBanners();
    alert(`✅ Image de ligue mise à jour !`);
  });
}

// ------------------------------------------
// ⚽ MATCHS ET PRONOSTICS
// ------------------------------------------
function switchMatchView(viewMode) {
  currentMatchView = viewMode;
  document.getElementById('btnTabUpcoming').className = viewMode === 'upcoming' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  document.getElementById('btnTabFinished').className = viewMode === 'finished' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  renderMatches();
}
function filterLeague(l) {
  currentLeague = l; applyTheme();
  document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;
  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  
  if (currentMatchView === 'upcoming') list = list.filter(m => !appState.scores[m.id] || appState.scores[m.id].status === 'LIVE');
  else list = list.filter(m => appState.scores[m.id] && appState.scores[m.id].status !== 'LIVE');

  const bannerArea = document.getElementById('leagueBannerArea');
  if (currentLeague !== 'all' && LEAGUE_INFO[currentLeague]) {
    const li = LEAGUE_INFO[currentLeague];
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
    const li = LEAGUE_INFO[m.league] || { name:m.league, flag:'⚽' };
    let totalPreds = 0; appState.users.forEach(u => { if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPreds++; });

    let statusBadgeHtml = `<span class="status-badge status-upcoming">⏳ 20:00</span>`;
    if (score && score.status === 'LIVE') statusBadgeHtml = `<span class="status-badge status-live">🔴 LIVE ${score.elapsed || 45}'</span>`;
    else if (score && score.status !== 'LIVE') statusBadgeHtml = `<span class="status-badge status-finished">✅ TERMINÉ</span>`;

    let res = '';
    if (score && score.status !== 'LIVE') {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Score Exact (+5 pts)':pts===3?'✅ Bon Vainqueur (+3 pts)':'❌ Incorrect (0 pt)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    const disableInput = (started || done) ? 'disabled' : '';
    const lockNotice = (disableInput && (!score || score.status==='LIVE')) ? '<div style="text-align:center;font-size:0.75rem;color:var(--danger);font-weight:bold;margin-bottom:6px">🔒 Pronostics Fermés</div>' : '';

    html += `
      <div class="match-card ${(score && score.status==='LIVE')?'is-live':''} ${(score && score.status!=='LIVE')?'finished':''}">
        <div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><div>${statusBadgeHtml} <span style="color:var(--gold);margin-left:8px">📅 ${m.date}</span></div></div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${getTeamCrest(m.home)}" class="team-crest"></div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${getTeamCrest(m.away)}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${lockNotice}
        ${!disableInput || pred.h !== '' ? `
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

function toggleMatchPredictions(matchId, matchDateStr) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;
  const started = hasMatchStarted(matchDateStr, "20:00");
  const isAdmin = (currentUser && currentUser.role === 'admin');

  if (el.style.display === 'none') {
    if (!started && !isAdmin) {
      alert("🔒 Anti-Triche : Les pronostics de vos amis seront visibles dès le coup d'envoi du match !");
      let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Joueurs ayant pronostiqué :</div>';
      appState.users.forEach(u => {
        const pred = u.preds && u.preds[matchId];
        if (pred && pred.h !== '' && pred.a !== '') {
          html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem"><span><strong>${u.username}</strong></span><span style="margin-left:auto;color:var(--green)">✔️ A parié</span></div>`;
        }
      });
      el.innerHTML = html; el.style.display = 'block'; return;
    }

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

function saveAll() {
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

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;
  localStorage.setItem('pf_session', JSON.stringify(currentUser));
  saveDataToCloud(); recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  alert(`${count} pronostics enregistrés ! ✅`);
}

// ------------------------------------------
// 👤 MON PROFIL (STATS AVANCÉES ET LISTE DES PRONOS)
// ------------------------------------------
function renderMyPredictions() {
  const container = document.getElementById('myPredictionsList');
  if (!container || !currentUser) return;
  
  let html = '';
  let count = 0;

  for (const [id, pred] of Object.entries(currentUser.preds || {})) {
    const match = ALL_MATCHES.find(m => m.id === id);
    if (!match) continue;
    count++;
    const score = appState.scores[id];
    let statusText = `<span style="color:var(--gold)">⏳ Attente du match</span>`;
    if (score && score.status !== 'LIVE') {
      const pts = calcPts(pred, score);
      statusText = `<span class="${pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong'}">Score final: ${score.h}-${score.a} (+${pts} pts)</span>`;
    }

    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
        <div style="flex:1"><strong>${match.home}</strong> vs <strong>${match.away}</strong></div>
        <div style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold;margin:0 10px">${pred.h} - ${pred.a}</div>
        <div style="width:140px;text-align:right">${statusText}</div>
      </div>`;
  }
  if (count === 0) html = '<p style="text-align:center;color:var(--text-muted)">Vous n\'avez fait aucun pronostic.</p>';
  container.innerHTML = html;
}

// ------------------------------------------
// 🏆 CLASSEMENTS
// ------------------------------------------
function filterLeaderboard(l) {
  leaderboardFilter = l;
  document.querySelectorAll('#page-leaderboard .league-tab').forEach(t => t.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderLeaderboard();
}

function renderLeaderboard() {
  const sorted = getSorted(leaderboardFilter);
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅ Exact</th><th>🎯 Bon</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const st = getUserStats(u, leaderboardFilter);
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const ptsToDisplay = leaderboardFilter === 'all' ? u.points : u.leaguePts;
    
    html += `<tr class="${isMe?'current-user':''}">
      <td>${medal}</td>
      <td><strong>${u.username}</strong> ${u.role==='admin'?'⭐':''}</td>
      <td>${st.total}</td><td style="color:var(--gold);font-weight:bold">${st.exact}</td><td style="color:var(--green);font-weight:bold">${st.correct}</td>
      <td style="font-size:1.1rem;font-weight:800">${ptsToDisplay} pts</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

function renderDashboardLeaderboard() {
  const sorted = getSorted('all'); const max = sorted[0]?.points || 1; let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'rgba(0,230,118,0.1)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px"><span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span><div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${u.username}</div><div style="height:4px;background:var(--bg-body);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div></div><span style="font-weight:800;color:var(--gold)">${u.points} pts</span></div>`;
  });
  document.getElementById('dashboardLeaderboard').innerHTML = html;
}

// ------------------------------------------
// ⚙️ OUTILS ADMINISTRATEURS
// ------------------------------------------
function checkAdminAccess() {
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList(); renderAdminLeagueBackgrounds(); renderAdminLeagueBanners(); renderAdminStats();
  } else {
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('topAdminBtn').style.display = 'none';
  }
}

function renderAdminMatchList() {
  const container = document.getElementById('adminMatchList');
  if (!container) return;
  const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  let list = ALL_MATCHES;
  if (searchVal) list = list.filter(m => m.home.toLowerCase().includes(searchVal) || m.away.toLowerCase().includes(searchVal));

  let html = '';
  list.slice(0, 100).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span><span style="flex:1;font-size:0.85rem;min-width:140px"><strong>${m.home}</strong> vs <strong>${m.away}</strong></span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button></div>`;
  });
  container.innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  saveDataToCloud(); recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert('Score enregistré !');
}

function adminSimulateScores() {
  let c = 0; ALL_MATCHES.filter(m => !appState.scores[m.id]).slice(0, 10).forEach(m => { appState.scores[m.id] = { h: Math.floor(Math.random() * 4), a: Math.floor(Math.random() * 3), status: 'FINISHED' }; c++; });
  saveDataToCloud(); recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderAdminMatchList(); alert(c + " scores simulés !");
}
function adminSimulateAll() {
  if (!confirm('Simuler TOUS les matchs ?')) return;
  ALL_MATCHES.forEach(m => { if (!appState.scores[m.id]) { appState.scores[m.id] = { h: Math.floor(Math.random() * 4), a: Math.floor(Math.random() * 3), status: 'FINISHED' }; } });
  saveDataToCloud(); recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderAdminMatchList(); alert("Tous simulés !");
}
function adminResetScores() {
  if (!confirm('Supprimer tous les scores enregistrés ?')) return;
  appState.scores = {}; saveDataToCloud(); recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderAdminMatchList(); alert("Scores réinitialisés !");
}
function adminSimulateLiveMatch() {
  ALL_MATCHES.slice(0, 3).forEach(m => { appState.scores[m.id] = { h: Math.floor(Math.random() * 3), a: Math.floor(Math.random() * 2), status: 'LIVE', elapsed: Math.floor(Math.random() * 70) + 15 }; });
  saveDataToCloud(); recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); alert("🔴 3 Matchs sont passés EN DIRECT !");
}
function renderAdminLeagueBackgrounds() {
  const container = document.getElementById('adminLeagueBackgrounds');
  if (!container) return; let html = '';
  for (const [key, li] of Object.entries(LEAGUE_INFO)) {
    const url = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[key]) || '';
    html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span><label class="btn btn-secondary btn-sm" style="cursor:pointer">📸 Changer fond<input type="file" accept="image/*" style="display:none" onchange="uploadAdminLeagueImage(event, 'leagueBackgrounds', '${key}')"></label>${url ? `<img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : ''}</div>`;
  }
  container.innerHTML = html;
}
function renderAdminLeagueBanners() {
  const container = document.getElementById('adminLeagueBanners');
  if (!container) return; let html = '';
  for (const [key, li] of Object.entries(LEAGUE_INFO)) {
    const url = (appState.settings.leagueBanners && appState.settings.leagueBanners[key]) || '';
    html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span><label class="btn btn-secondary btn-sm" style="cursor:pointer">📸 Changer bannière<input type="file" accept="image/*" style="display:none" onchange="uploadAdminLeagueImage(event, 'leagueBanners', '${key}')"></label>${url ? `<img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : ''}</div>`;
  }
  container.innerHTML = html;
}
function renderAdminStats() {
  const el = document.getElementById('adminStats');
  if (!el) return;
  const t = ALL_MATCHES.length; const s = Object.keys(appState.scores).length; const p = appState.users.reduce((a, u) => a + Object.keys(u.preds || {}).length, 0);
  el.innerHTML = `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs 2026-27</span><strong>${t}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Scores validés</span><strong style="color:var(--green)">${s}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Joueurs inscrits</span><strong>${appState.users.length}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0"><span>Pronostics totaux sur le site</span><strong style="color:var(--gold);font-size:1.2rem">${p}</strong></div>`;
}
function adminPublishAnnouncement() { const t = document.getElementById('adminAnnounceInput')?.value.trim(); if (!t) return; appState.settings.announce = t; saveDataToCloud(); document.getElementById('announcementBox').style.display='block'; document.getElementById('announcementText').textContent=t; alert('Annonce publiée ! 📢'); }
function changeTheme(c) { appState.settings.themeColor = c; applyTheme(); saveDataToCloud(); }

// ==========================================
// DÉMARRAGE ET UI GÉNÉRALE
// ==========================================
function updateUI() {
  if (!currentUser) return;
  document.getElementById('navPoints').textContent = (currentUser.points || 0) + ' pts';
  const navAv = document.getElementById('navAvatar');
  if (currentUser.avatar) { navAv.textContent = ''; navAv.style.backgroundImage = `url('${currentUser.avatar}')`; } 
  else { navAv.style.backgroundImage = 'none'; navAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  
  const st = getUserStats(currentUser);
  document.getElementById('statPoints').textContent = currentUser.points || 0;
  document.getElementById('statPredictions').textContent = st.total;
  document.getElementById('statExact').textContent = st.exact;
  
  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  const rankStr = rankIdx >= 0 ? '#' + (rankIdx + 1) : '#1';
  document.getElementById('statRank').textContent = rankStr;
  
  // Profil complet
  document.getElementById('profileUsername').textContent = currentUser.username || '-';
  document.getElementById('profileEmail').textContent = currentUser.email || '-';
  
  const wRate = document.getElementById('profileWinRate'); if (wRate) wRate.textContent = st.winRate + '%';
  const eRate = document.getElementById('profileExactRate'); if (eRate) eRate.textContent = st.exactRate + '%';
  const tPreds = document.getElementById('profileTotalPreds'); if (tPreds) tPreds.textContent = st.total;

  const profAv = document.getElementById('profileBigAvatar');
  if (profAv) {
    if (currentUser.avatar) { profAv.textContent = ''; profAv.style.backgroundImage = `url('${currentUser.avatar}')`; } 
    else { profAv.style.backgroundImage = 'none'; profAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  }

  if (sorted[0]) {
    document.getElementById('kingUsername').textContent = sorted[0].username;
    document.getElementById('kingPoints').textContent = sorted[0].points + ' pts';
  }
}

function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  const authScreen = document.getElementById('authScreen');
  if (authScreen) authScreen.style.backgroundImage = appState.settings.authBgImage ? `url('${appState.settings.authBgImage}')` : 'none';
  
  let bg = appState.settings.bgImage;
  if (currentLeague === 'dashboard' && appState.settings.dashboardBgImage) bg = appState.settings.dashboardBgImage;
  else if (currentLeague !== 'all' && currentLeague !== 'dashboard' && LEAGUE_INFO[currentLeague]) {
    bg = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[currentLeague]) || LEAGUE_INFO[currentLeague].defaultBg;
  }
  document.documentElement.style.setProperty('--bg-image', bg ? `url('${bg}')` : 'none');
}

function init() {
  if (appState.users.length === 0) appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  recalculateAllCloudPoints();
  fetchSupabaseData(); // Appel initial Supabase

  if (currentUser) { document.getElementById('authScreen').style.display = 'none'; setupApp(); } 
  else { document.getElementById('authScreen').style.display = 'flex'; applyTheme(); }
}

function setupApp() {
  applyTheme(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  checkAdminAccess();
}

function navigateTo(p) {
  if (p === 'admin') { if (!currentUser || currentUser.role !== 'admin') { alert("⛔ Accès refusé ! Réservé à l'administrateur."); return; } }
  
  if (p === 'dashboard') { currentLeague = 'dashboard'; applyTheme(); } 
  else if (p === 'matches') { currentLeague = 'all'; applyTheme(); }

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  
  if (p === 'admin') { renderAdminMatchList(); renderAdminLeagueBackgrounds(); renderAdminLeagueBanners(); renderAdminStats(); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchAuth(tab) {
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') { document.getElementById('tabLogin').classList.add('active'); document.getElementById('tabReg').classList.remove('active'); document.getElementById('loginForm').style.display = 'block'; document.getElementById('registerForm').style.display = 'none'; } 
  else { document.getElementById('tabReg').classList.add('active'); document.getElementById('tabLogin').classList.remove('active'); document.getElementById('loginForm').style.display = 'none'; document.getElementById('registerForm').style.display = 'block'; }
}

async function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.innerText = "⏳ Connexion..."; btn.disabled = true;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) appState.users = data;
    } catch(err) {}
  }
  const found = appState.users.find(u => (u.email.toLowerCase() === em || u.username.toLowerCase() === em) && u.pass === pass);
  if (found) {
    currentUser = found; localStorage.setItem('pf_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none'; setupApp();
  } else {
    document.getElementById('authError').textContent = 'Identifiant ou mot de passe incorrect.'; document.getElementById('authError').style.display = 'block';
  }
  btn.innerText = "Se connecter →"; btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');
  btn.innerText = "⏳ Création..."; btn.disabled = true;

  if (appState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    document.getElementById('authError').textContent = 'Pseudo déjà utilisé.'; document.getElementById('authError').style.display = 'block';
    btn.innerText = "Créer mon compte →"; btn.disabled = false; return;
  }
  const newUser = { id: 'u_' + Date.now(), username, email, pass, role: 'user', points: 0, preds: {}, createdAt: new Date().toISOString() };
  appState.users.push(newUser); currentUser = newUser; localStorage.setItem('pf_session', JSON.stringify(currentUser));
  if (supabase) { try { await supabase.from('profiles').insert([newUser]); } catch (e) {} }
  document.getElementById('authScreen').style.display = 'none'; setupApp(); btn.innerText = "Créer mon compte →"; btn.disabled = false;
}

function handleLogout() { localStorage.removeItem('pf_session'); currentUser = null; location.reload(); }
function togglePassword(id) { const input = document.getElementById(id); input.type = input.type === "password" ? "text" : "password"; }

window.onload = init;
