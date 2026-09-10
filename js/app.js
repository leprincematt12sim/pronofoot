const firebaseConfig = {
  apiKey: "AIzaSyCINnc9gGuNl5oF_0GBYq4fnO6MMlW8DFs",
  authDomain: "pronofoot-89f3e.firebaseapp.com",
  projectId: "pronofoot-89f3e",
  storageBucket: "pronofoot-89f3e.firebasestorage.app",
  messagingSenderId: "163921400915",
  appId: "1:163921400915:web:90d3b4ffeb1cb1bd99a2a6"
};

let firestore = null;
try {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  firestore = firebase.firestore();
} catch (e) {}

const REAL_API_KEY = "5eb745d2e42b3f1e72fddff81191592e";

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
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [],
  settings: JSON.parse(localStorage.getItem('pf_settings')) || { themeColor: '#00E676', authBgImage: '', dashboardBgImage: '', bgImage: '', leagueBanners: {}, leagueBackgrounds: {}, playlist: [] }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';
let currentMatchView = 'upcoming';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }
function getAvatarColor(u) { return AVATAR_COLORS[(u||'A').charCodeAt(0)%AVATAR_COLORS.length]; }

// DÉBLOCAGE ADMIN SECRETS EN 5 CLICS SUR LE LOGO
let secretClicks = 0;
function secretAdminUnlock() {
  secretClicks++;
  if (secretClicks >= 5 && currentUser) {
    currentUser.role = 'admin';
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].role = 'admin';
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    if (firestore) firestore.collection('users').doc(currentUser.id).update({ role: 'admin' });
    alert('🔓 PASS VIP ADMIN ACTIVÉ !');
    setupApp();
    secretClicks = 0;
  }
}

function parseMatchDateTime(dateStr, timeStr = "20:00") {
  if (!dateStr) return new Date(2099, 0, 1);
  let d=1, m=1, y=2026;
  if (dateStr.includes('/')) { const p = dateStr.split('/'); d = parseInt(p[0]); m = parseInt(p[1]); y = parseInt(p[2]); }
  else if (dateStr.includes('-')) { const p = dateStr.split('-'); y = parseInt(p[0]); m = parseInt(p[1]); d = parseInt(p[2]); }
  return new Date(y, m - 1, d, 20, 0, 0);
}
function hasMatchStarted(dateStr, timeStr) { return new Date() >= parseMatchDateTime(dateStr, timeStr); }

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
  compressImage(event.target.files[0], 150, 0.5, async dataUrl => {
    currentUser.avatar = dataUrl;
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].avatar = dataUrl;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    if (firestore) { try { await firestore.collection('users').doc(currentUser.id).update({ avatar: dataUrl }); } catch (err) {} }
    updateUI(); renderLeaderboard(); renderDashboardLeaderboard();
    alert("✅ Photo de profil mise à jour !");
  });
}

function uploadAuthBgFromFile(event) {
  compressImage(event.target.files[0], 800, 0.4, async d => {
    appState.settings.authBgImage = d; applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ authBgImage: d }, { merge: true }); } catch (err) {} }
    alert("✅ Fond Connexion OK !");
  });
}
function uploadDashboardBgFromFile(event) {
  compressImage(event.target.files[0], 800, 0.4, async d => {
    appState.settings.dashboardBgImage = d; applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ dashboardBgImage: d }, { merge: true }); } catch (err) {} }
    alert("✅ Fond Accueil OK !");
  });
}

function listenCloudData() {
  if (!firestore) return;
  firestore.collection('users').onSnapshot(snap => {
    const cloudUsers = [];
    snap.forEach(d => cloudUsers.push({ id: d.id, ...d.data() }));
    if (cloudUsers.length > 0) appState.users = cloudUsers;
    if (currentUser) { const u = appState.users.find(x => x.id === currentUser.id); if (u) currentUser = u; }
    recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  });
  firestore.collection('settings').doc('global').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      appState.scores = data.scores || {};
      appState.settings = { ...appState.settings, ...data };
      applyTheme(); recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
      if (currentUser && currentUser.role === 'admin') { renderAdminMatchList(); renderAdminLeagueBanners(); }
    }
  });
}

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

function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  const authScreen = document.getElementById('authScreen');
  if (authScreen) { authScreen.style.backgroundImage = appState.settings.authBgImage ? `url('${appState.settings.authBgImage}')` : 'none'; authScreen.style.backgroundSize = 'cover'; }
  let bg = appState.settings.bgImage;
  if (currentLeague === 'dashboard' && appState.settings.dashboardBgImage) bg = appState.settings.dashboardBgImage;
  document.documentElement.style.setProperty('--bg-image', bg ? `url('${bg}')` : 'none');
}

function init() {
  if (appState.users.length === 0) { appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} }); }
  recalculateAllCloudPoints(); listenCloudData(); setupMonthFilter();
  if (currentUser) { document.getElementById('authScreen').style.display = 'none'; setupApp(); } 
  else { document.getElementById('authScreen').style.display = 'flex'; applyTheme(); }
}

function setupApp() {
  applyTheme(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
  } else {
    document.getElementById('adminNavBtn').style.display = 'none'; document.getElementById('topAdminBtn').style.display = 'none';
  }
}

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').style.display = 'block'; document.getElementById('registerForm').style.display = 'none';
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('loginForm').style.display = 'none'; document.getElementById('registerForm').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const userOrEmail = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.innerText = "⏳ Connexion..."; btn.disabled = true;

  if (firestore && appState.users.length <= 1) {
    try { const snap = await firestore.collection('users').get(); if (!snap.empty) appState.users = snap.docs.map(d => ({id: d.id, ...d.data()})); } catch(err) {}
  }
  const found = appState.users.find(u => (u.email.toLowerCase() === userOrEmail || u.username.toLowerCase() === userOrEmail) && u.pass === pass);
  if (found) {
    currentUser = found; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
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
  if (firestore) { try { const ref = await firestore.collection('users').add(newUser); newUser.id = ref.id; } catch (e) {} }
  appState.users.push(newUser); currentUser = newUser; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none'; setupApp(); btn.innerText = "Créer mon compte →"; btn.disabled = false;
}

function handleLogout() { localStorage.removeItem('pf_cloud_session'); currentUser = null; location.reload(); }
function togglePassword(id) { const input = document.getElementById(id); input.type = input.type === "password" ? "text" : "password"; }

function setupMonthFilter() {
  const d = new Date(); currentMonth = (d.getMonth() + 1).toString().padStart(2, '0');
  const bar = document.getElementById('monthFilterBar');
  if (!bar) return;
  const months = [{val:'all', lbl:'Toute l\'année'}, {val:'08',lbl:'Août'}, {val:'09',lbl:'Sept.'}, {val:'10',lbl:'Oct.'}, {val:'11',lbl:'Nov.'}, {val:'12',lbl:'Déc.'}, {val:'01',lbl:'Janv.'}, {val:'02',lbl:'Févr.'}, {val:'03',lbl:'Mars'}, {val:'04',lbl:'Avril'}, {val:'05',lbl:'Mai'}];
  bar.innerHTML = months.map(mo => `<button class="matchday-pill ${mo.val === currentMonth?'active':''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`).join('');
}
function filterByMonth(m) { currentMonth = m; document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }
function filterLeague(l) { currentLeague = l; applyTheme(); document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }

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
  if (list.length === 0) { container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">Aucun match trouvé pour ce filtre.</p>'; return; }

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

    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
        <div style="flex:1"><strong>${match.home}</strong> vs <strong>${match.away}</strong></div>
        <div style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold;margin:0 10px">${pred.h} - ${pred.a}</div>
        <div style="min-width:120px;text-align:right">${statusText}</div>
      </div>`;
  }
  if (count === 0) html = '<p style="text-align:center;color:var(--text-muted)">Aucun pronostic enregistré.</p>';
  container.innerHTML = html;
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

function renderAdminMatchList() {
  let html = '';
  ALL_MATCHES.slice(0, 50).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span><span style="flex:1;font-size:0.85rem;min-width:140px">${m.home} vs ${m.away}</span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button></div>`;
  });
  document.getElementById('adminMatchList').innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  if (firestore) { try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {} }
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert('Score enregistré !');
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onload = init;
