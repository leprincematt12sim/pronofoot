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

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

const I18N = {
  fr: { auth_sub: "Saison 2026-27 — Multijoueur", btn_login_submit: "Se connecter →", btn_register_submit: "Créer mon compte →", email: "Email / Pseudo", password: "Mot de passe", pseudo: "Pseudo", nav_home: "Accueil", nav_matches: "Matchs", nav_rank: "Classement", nav_groups: "Groupes", nav_admin: "Admin", my_points: "Mes Points", my_rank: "Mon Rang", btn_predict: "⚽ Pronostiquer les matchs →", top_5: "🏆 Top 5 Général", btn_save: "💾 Sauvegarder", all_matches: "🌍 Tous", btn_create_group: "➕ Créer", btn_join_group: "🔑 Rejoindre", err_login: "Identifiant ou mot de passe incorrect.", err_reg: "Ce pseudo est déjà pris.", success_save: "pronostics sauvegardés !", welcome: "Bienvenue ! 👋" },
  en: { auth_sub: "Season 2026-27 — Multiplayer", btn_login_submit: "Log in →", btn_register_submit: "Create Account →", email: "Email / Username", password: "Password", pseudo: "Username", nav_home: "Home", nav_matches: "Matches", nav_rank: "Standings", nav_groups: "Groups", nav_admin: "Admin", my_points: "My Points", my_rank: "My Rank", btn_predict: "⚽ Predict matches →", top_5: "🏆 Top 5 Overall", btn_save: "💾 Save", all_matches: "🌍 All", btn_create_group: "➕ Create", btn_join_group: "🔑 Join", err_login: "Incorrect username or password.", err_reg: "Username already taken.", success_save: "predictions saved!", welcome: "Welcome! 👋" },
  de: { auth_sub: "Saison 2026-27 — Mehrspieler", btn_login_submit: "Anmelden →", btn_register_submit: "Konto erstellen →", email: "E-Mail / Benutzername", password: "Passwort", pseudo: "Benutzername", nav_home: "Start", nav_matches: "Spiele", nav_rank: "Tabelle", nav_groups: "Gruppen", nav_admin: "Admin", my_points: "Meine Punkte", my_rank: "Mein Rang", btn_predict: "⚽ Spiele tippen →", top_5: "🏆 Top 5 Gesamt", btn_save: "💾 Speichern", all_matches: "🌍 Alle", btn_create_group: "➕ Erstellen", btn_join_group: "🔑 Beitreten", err_login: "Falscher Benutzername oder Passwort.", err_reg: "Benutzername bereits vergeben.", success_save: "Tipps gespeichert!", welcome: "Willkommen! 👋" }
};
let currentLang = 'fr';

window.setLanguage = function(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key]) {
      if (el.tagName === 'INPUT') el.placeholder = I18N[lang][key];
      else el.textContent = I18N[lang][key];
    }
  });
};

const TEAM_CRESTS = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png", "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png", "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png", "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png", "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png", "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png", "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png"
};

const LEAGUE_INFO = {
  champions:{ name:'Ligue des Champions', flag:'🏆', accent:'#f5c518' },
  premier:{ name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent:'#3d195b' },
  laliga:{ name:'La Liga', flag:'🇪🇸', accent:'#ee8707' },
  seriea:{ name:'Serie A', flag:'🇮🇹', accent:'#024494' },
  bundesliga:{ name:'Bundesliga', flag:'🇩🇪', accent:'#d20515' },
  ligue1:{ name:'Ligue 1', flag:'🇫🇷', accent:'#091c3e' }
};
const AVATAR_COLORS = ['#00E676','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'];

let appState = {
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [],
  settings: { themeColor: '#00E676', playlist: [] }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';
let currentMatchView = 'upcoming';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }

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
function getAvatarColor(u) { return AVATAR_COLORS[(u||'A').charCodeAt(0)%AVATAR_COLORS.length]; }

function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
}

function listenCloudData() {
  if (!firestore) return;
  firestore.collection('users').onSnapshot(snap => {
    const cloudUsers = [];
    snap.forEach(d => cloudUsers.push({ id: d.id, ...d.data() }));
    if (cloudUsers.length > 0) appState.users = cloudUsers;
    if (currentUser) { const u = appState.users.find(x => x.id === currentUser.id); if (u) currentUser = u; }
    recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  });
  firestore.collection('settings').doc('global').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      appState.scores = data.scores || {};
      appState.settings = { ...appState.settings, ...data };
      applyTheme(); recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
      if (currentUser && currentUser.role === 'admin') renderAdminMatchList();
    }
  });
}

window.init = function() {
  if (appState.users.length === 0) appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  recalculateAllCloudPoints(); listenCloudData(); setupMonthFilter();
  if (currentUser) {
    const authEl = document.getElementById('authScreen');
    if (authEl) authEl.style.display = 'none';
    setupApp();
  } else {
    const authEl = document.getElementById('authScreen');
    if (authEl) authEl.style.display = 'flex';
    applyTheme(); setLanguage('fr');
  }
};

function setupApp() {
  applyTheme(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderMyPredictions();
  if (currentUser && currentUser.role === 'admin') {
    const btnNav = document.getElementById('adminNavBtn'); if (btnNav) btnNav.style.display = 'flex';
    const btnTop = document.getElementById('topAdminBtn'); if (btnTop) btnTop.style.display = 'block';
    renderAdminMatchList(); renderAdminStats();
  } else {
    const btnNav = document.getElementById('adminNavBtn'); if (btnNav) btnNav.style.display = 'none';
    const btnTop = document.getElementById('topAdminBtn'); if (btnTop) btnTop.style.display = 'none';
  }
}

window.updateUI = function() {
  if (!currentUser) return;
  safeSetText('navPoints', (currentUser.points || 0) + ' pts');
  
  const navAv = document.getElementById('navAvatar');
  if (navAv) {
    if (currentUser.avatar) { navAv.textContent = ''; navAv.style.backgroundImage = `url('${currentUser.avatar}')`; navAv.style.backgroundSize = 'cover'; } 
    else { navAv.style.backgroundImage = 'none'; navAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); navAv.style.background = getAvatarColor(currentUser.username); }
  }
  
  const st = getUserStats(currentUser);
  safeSetText('welcomeMsg', (I18N[currentLang]['welcome'] || 'Bienvenue ! 👋') + ' ' + currentUser.username);
  safeSetText('statPoints', currentUser.points || 0);
  safeSetText('statPredictions', st.total);
  safeSetText('statExact', st.exact);
  
  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  const rankStr = rankIdx >= 0 ? '#' + (rankIdx + 1) : '#1';
  safeSetText('statRank', rankStr);
  
  safeSetText('profileUsername', currentUser.username || '-');
  safeSetText('profileEmail', currentUser.email || '-');
  safeSetText('profileRole', currentUser.role === 'admin' ? '⭐ Administrateur' : '🎮 Joueur');
  safeSetText('profilePoints', currentUser.points || 0);
  safeSetText('profileRank', rankStr);

  const profAv = document.getElementById('profileBigAvatar');
  if (profAv) {
    if (currentUser.avatar) { profAv.textContent = ''; profAv.style.backgroundImage = `url('${currentUser.avatar}')`; profAv.style.backgroundSize = 'cover'; } 
    else { profAv.style.backgroundImage = 'none'; profAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  }

  if (sorted[0]) {
    safeSetText('kingUsername', sorted[0].username + (sorted[0].role === 'admin' ? ' ⭐' : ''));
    safeSetText('kingPoints', sorted[0].points + ' pts');
  }
};

window.switchAuth = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  const errEl = document.getElementById('authError'); if (errEl) errEl.style.display = 'none';
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    const lf = document.getElementById('loginForm'); if (lf) lf.style.display = 'block';
    const rf = document.getElementById('registerForm'); if (rf) rf.style.display = 'none';
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    const lf = document.getElementById('loginForm'); if (lf) lf.style.display = 'none';
    const rf = document.getElementById('registerForm'); if (rf) rf.style.display = 'block';
  }
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const userOrEmail = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.innerText = "⏳ Connexion..."; btn.disabled = true; }

  if (firestore && appState.users.length <= 1) {
    try { const snap = await firestore.collection('users').get(); if (!snap.empty) appState.users = snap.docs.map(d => ({id: d.id, ...d.data()})); } catch(err) {}
  }
  const found = appState.users.find(u => (u.email.toLowerCase() === userOrEmail || u.username.toLowerCase() === userOrEmail) && u.pass === pass);
  if (found) {
    currentUser = found; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    const authEl = document.getElementById('authScreen'); if (authEl) authEl.style.display = 'none';
    setupApp();
  } else {
    const errEl = document.getElementById('authError');
    if (errEl) { errEl.textContent = 'Identifiant ou mot de passe incorrect.'; errEl.style.display = 'block'; }
  }
  if (btn) { btn.innerText = "Se connecter →"; btn.disabled = false; }
};

window.handleRegister = async function(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');
  if (btn) { btn.innerText = "⏳ Création..."; btn.disabled = true; }

  if (appState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    const errEl = document.getElementById('authError');
    if (errEl) { errEl.textContent = 'Pseudo déjà utilisé.'; errEl.style.display = 'block'; }
    if (btn) { btn.innerText = "Créer mon compte →"; btn.disabled = false; } return;
  }
  const newUser = { id: 'u_' + Date.now(), username, email, pass, role: 'user', points: 0, preds: {}, createdAt: new Date().toISOString() };
  if (firestore) { try { const ref = await firestore.collection('users').add(newUser); newUser.id = ref.id; } catch (e) {} }
  appState.users.push(newUser); currentUser = newUser; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  const authEl = document.getElementById('authScreen'); if (authEl) authEl.style.display = 'none';
  setupApp(); if (btn) { btn.innerText = "Créer mon compte →"; btn.disabled = false; }
};

window.secretAdminUnlock = function() {
  let clicks = (window.secretClicks || 0) + 1;
  window.secretClicks = clicks;
  if (clicks >= 5 && currentUser) {
    currentUser.role = 'admin';
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].role = 'admin';
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    if (firestore) firestore.collection('users').doc(currentUser.id).update({ role: 'admin' });
    alert('🔓 PASS VIP ADMIN ACTIVÉ !');
    setupApp(); window.secretClicks = 0;
  }
};

window.handleLogout = function() { localStorage.removeItem('pf_cloud_session'); currentUser = null; location.reload(); };
window.togglePassword = function(id) { const input = document.getElementById(id); if (input) input.type = input.type === "password" ? "text" : "password"; };

function setupMonthFilter() {
  const d = new Date(); currentMonth = (d.getMonth() + 1).toString().padStart(2, '0');
  const bar = document.getElementById('monthFilterBar');
  if (!bar) return;
  const months = [{val:'all', lbl:'Toute l\'année'}, {val:'08',lbl:'Août'}, {val:'09',lbl:'Sept.'}, {val:'10',lbl:'Oct.'}, {val:'11',lbl:'Nov.'}, {val:'12',lbl:'Déc.'}, {val:'01',lbl:'Janv.'}, {val:'02',lbl:'Févr.'}, {val:'03',lbl:'Mars'}, {val:'04',lbl:'Avril'}, {val:'05',lbl:'Mai'}];
  bar.innerHTML = months.map(mo => `<button class="matchday-pill ${mo.val === currentMonth?'active':''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`).join('');
}

window.filterByMonth = function(m) { currentMonth = m; document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); };
window.filterLeague = function(l) { currentLeague = l; applyTheme(); document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); };
window.switchMatchView = function(viewMode) { currentMatchView = viewMode; const btnU = document.getElementById('btnTabUpcoming'); if (btnU) btnU.className = viewMode === 'upcoming' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'; const btnF = document.getElementById('btnTabFinished'); if (btnF) btnF.className = viewMode === 'finished' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'; renderMatches(); };

window.toggleMatchPredictions = function(matchId, matchDateStr) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;
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
};

function renderMatches() {
  const container = document.getElementById('matchesContainer'); if (!container) return;
  let list = ALL_MATCHES;
  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  if (currentMonth !== 'all') { list = list.filter(m => { const parts = m.date.split('/'); return parts.length === 3 && parts[1] === currentMonth; }); }
  if (currentMatchView === 'upcoming') { list = list.filter(m => !appState.scores[m.id] || appState.scores[m.id].status === 'LIVE'); } 
  else { list = list.filter(m => appState.scores[m.id] && appState.scores[m.id].status !== 'LIVE'); }

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

    const disableInput = (started || done) ? 'disabled' : '';

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

window.saveAll = async function() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  const btn = document.getElementById('btnSavePronos');
  if(btn) { btn.innerHTML = "⏳ Sauvegarde..."; btn.disabled = true; }

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
  
  if(btn) { btn.innerHTML = "✅ "+count+" Sauvegardés"; btn.disabled = false; setTimeout(()=>{btn.innerHTML="💾 Sauvegarder Pronos";}, 2000); }
};

function renderDashboardLeaderboard() {
  const container = document.getElementById('dashboardLeaderboard'); if (!container) return;
  const sorted = getSorted(); const max = sorted[0]?.points || 1; let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'rgba(0,230,118,0.1)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px"><span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span><div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${u.username} ${u.role==='admin'?'⭐':''}</div><div style="height:4px;background:var(--bg-body);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div></div><span style="font-weight:800;color:var(--gold)">${u.points} pts</span></div>`;
  });
  container.innerHTML = html;
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContainer'); if (!container) return;
  const sorted = getSorted();
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅ Exact</th><th>🎯 Bon</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const st = getUserStats(u);
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    html += `<tr class="${isMe?'current-user':''}"><td>${medal}</td><td><strong>${u.username}</strong> ${u.role==='admin'?'⭐':''}</td><td>${st.total}</td><td style="color:var(--gold);font-weight:bold">${st.exact}</td><td style="color:var(--green);font-weight:bold">${st.correct}</td><td style="font-size:1.1rem;font-weight:800">${u.points} pts</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
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

// ADMIN ACTIONS EXPLICITES AU NIVEAU GLOBAL
window.renderAdminMatchList = function() {
  const container = document.getElementById('adminMatchList'); if (!container) return;
  const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  let list = ALL_MATCHES;
  if (searchVal) list = list.filter(m => m.home.toLowerCase().includes(searchVal) || m.away.toLowerCase().includes(searchVal));
  let html = '';
  list.slice(0, 50).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span><span style="flex:1;font-size:0.85rem;min-width:140px">${m.home} vs ${m.away}</span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button></div>`;
  });
  container.innerHTML = html;
};

window.adminSaveScore = async function(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  if (firestore) { try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {} }
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert('Score enregistré !');
};

window.saveAndSyncApiSports = async function() {
  const btn = document.getElementById('btnSyncApi');
  if(btn) { btn.innerHTML = "⏳ Recherche des scores..."; btn.disabled = true; }
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayStr}`, { method: "GET", headers: { "x-apisports-key": REAL_API_KEY } });
    const data = await res.json();
    const fixtures = data.response || [];
    let count = 0;
    fixtures.forEach(f => {
      const status = f.fixture.status.short;
      const hName = f.teams.home.name.toLowerCase();
      const aName = f.teams.away.name.toLowerCase();
      const match = ALL_MATCHES.find(m => m.home.toLowerCase().includes(hName) || m.away.toLowerCase().includes(aName));
      if (match) {
        if (['1H','HT','2H','ET','P','LIVE'].includes(status)) { appState.scores[match.id] = { h: f.goals.home, a: f.goals.away, status: 'LIVE', elapsed: f.fixture.status.elapsed }; count++; } 
        else if (['FT','AET','PEN'].includes(status)) { appState.scores[match.id] = { h: f.goals.home, a: f.goals.away, status: 'FINISHED' }; count++; }
      }
    });
    if (firestore) { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); }
    recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert(`✅ ${count} match(s) actualisé(s) depuis l'API Sports !`);
  } catch (err) {
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert("❌ Erreur API : " + err.message);
  }
};

window.adminSimulateLiveMatch = function() {
  ALL_MATCHES.slice(0, 3).forEach(m => { appState.scores[m.id] = { h: Math.floor(Math.random() * 3), a: Math.floor(Math.random() * 2), status: 'LIVE', elapsed: Math.floor(Math.random() * 70) + 15 }; });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert("🔴 3 Matchs sont passés EN DIRECT !");
};

window.adminSimulateScores = function() {
  ALL_MATCHES.filter(m => !appState.scores[m.id]).slice(0, 10).forEach(m => { appState.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3), status: 'FINISHED' }; });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert("10 scores simulés !");
};

window.adminSimulateAll = function() {
  if (!confirm('Simuler TOUS les matchs ?')) return;
  ALL_MATCHES.forEach(m => { if (!appState.scores[m.id]) appState.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3), status: 'FINISHED' }; });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
};

window.adminResetScores = function() {
  if (!confirm('Supprimer tous les scores enregistrés ?')) return;
  appState.scores = {};
  if (firestore) firestore.collection('settings').doc('global').set({ scores: {} }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
};

window.changeTheme = function(c) {
  appState.settings.themeColor = c;
  if (firestore) firestore.collection('settings').doc('global').set({ themeColor: c }, { merge: true });
  applyTheme();
};

window.navigateTo = function(p) {
  if (p === 'admin' && (!currentUser || currentUser.role !== 'admin')) { alert("⛔ Accès refusé ! Réservé à l'administrateur."); return; }
  if (p === 'dashboard') { currentLeague = 'dashboard'; applyTheme(); } else { currentLeague = 'all'; applyTheme(); }
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p); if (page) page.classList.add('active');
  const btn = document.querySelector(`.bottom-nav-item[onclick="navigateTo('${p}')"]`); if (btn) btn.classList.add('active');
  if (p === 'admin') renderAdminMatchList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.onload = init;
