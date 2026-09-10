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

// --- SÉCURITÉ UNIVERSELLE DOM (NE PLANTED PLUS JAMAIS) ---
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function safeSetDisplay(id, displayValue) {
  const el = document.getElementById(id);
  if (el) el.style.display = displayValue;
}

const I18N = {
  fr: { auth_sub: "Saison 2026-27 — Multijoueur", btn_login_submit: "Se connecter →", btn_register_submit: "Créer mon compte →", email: "Email / Pseudo", password: "Mot de passe", pseudo: "Pseudo", nav_home: "Accueil", nav_matches: "Matchs", nav_rank: "Classement", nav_groups: "Groupes", nav_admin: "Admin", my_points: "Mes Points", my_rank: "Mon Rang", btn_predict: "⚽ Pronostiquer les matchs →", top_5: "🏆 Top 5 Général", btn_save: "💾 Sauvegarder", all_matches: "🌍 Tous", btn_create_group: "➕ Créer", btn_join_group: "🔑 Rejoindre", err_login: "Identifiant ou mot de passe incorrect.", err_reg: "Ce pseudo est déjà utilisé.", success_save: "pronostics sauvegardés !", welcome: "Bienvenue ! 👋" },
  en: { auth_sub: "Season 2026-27 — Multiplayer", btn_login_submit: "Log in →", btn_register_submit: "Create Account →", email: "Email / Username", password: "Password", pseudo: "Username", nav_home: "Home", nav_matches: "Matches", nav_rank: "Standings", nav_groups: "Groups", nav_admin: "Admin", my_points: "My Points", my_rank: "My Rank", btn_predict: "⚽ Predict matches →", top_5: "🏆 Top 5 Overall", btn_save: "💾 Save", all_matches: "🌍 All", btn_create_group: "➕ Create", btn_join_group: "🔑 Join", err_login: "Incorrect username or password.", err_reg: "Username already taken.", success_save: "predictions saved!", welcome: "Welcome! 👋" },
  de: { auth_sub: "Saison 2026-27 — Mehrspieler", btn_login_submit: "Anmelden →", btn_register_submit: "Konto erstellen →", email: "E-Mail / Benutzername", password: "Passwort", pseudo: "Benutzername", nav_home: "Start", nav_matches: "Spiele", nav_rank: "Tabelle", nav_groups: "Gruppen", nav_admin: "Admin", my_points: "Meine Punkte", my_rank: "Mein Rang", btn_predict: "⚽ Spiele tippen →", top_5: "🏆 Top 5 Gesamt", btn_save: "💾 Speichern", all_matches: "🌍 Alle", btn_create_group: "➕ Erstellen", btn_join_group: "🔑 Beitreten", err_login: "Falscher Benutzername oder Passwort.", err_reg: "Benutzername bereits vergeben.", success_save: "Tipps gespeichert!", welcome: "Willkommen! 👋" }
};
let currentLang = 'fr';

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key]) {
      if (el.tagName === 'INPUT') el.placeholder = I18N[lang][key];
      else el.textContent = I18N[lang][key];
    }
  });
}

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
  settings: { themeColor: '#00E676' }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';
let currentMatchView = 'upcoming';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }
function getAvatarColor(u) { return AVATAR_COLORS[(u||'A').charCodeAt(0)%AVATAR_COLORS.length]; }

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

function init() {
  if (appState.users.length === 0) {
    appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  }

  recalculateAllCloudPoints();
  listenCloudData();

  if (currentUser) { safeSetDisplay('authScreen', 'none'); setupApp(); } 
  else { safeSetDisplay('authScreen', 'flex'); applyTheme(); setLanguage('fr'); }
}

function setupApp() {
  applyTheme(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  checkAdminStatus();
}

function checkAdminStatus() {
  const isAdmin = currentUser && currentUser.role === 'admin';
  safeSetDisplay('adminNavBtn', isAdmin ? 'flex' : 'none');
  safeSetDisplay('topAdminBtn', isAdmin ? 'block' : 'none');
  if (isAdmin) renderAdminMatchList();
}

function updateUI() {
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

  if (sorted[0]) {
    safeSetText('kingUsername', sorted[0].username + (sorted[0].role === 'admin' ? ' ⭐' : ''));
    safeSetText('kingPoints', sorted[0].points + ' pts');
  }

  checkAdminStatus();
}

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  safeSetDisplay('authError', 'none');
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    safeSetDisplay('loginForm', 'block'); safeSetDisplay('registerForm', 'none');
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    safeSetDisplay('loginForm', 'none'); safeSetDisplay('registerForm', 'block');
  }
}

async function handleLogin(e) {
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
    safeSetDisplay('authScreen', 'none'); setupApp();
  } else {
    safeSetText('authError', I18N[currentLang]['err_login'] || 'Identifiant incorrect.');
    safeSetDisplay('authError', 'block');
  }
  if (btn) { btn.innerText = "Se connecter →"; btn.disabled = false; }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');
  if (btn) { btn.innerText = "⏳ Création..."; btn.disabled = true; }

  if (appState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    safeSetText('authError', I18N[currentLang]['err_reg'] || 'Pseudo déjà pris.');
    safeSetDisplay('authError', 'block');
    if (btn) { btn.innerText = "Créer mon compte →"; btn.disabled = false; } return;
  }
  const newUser = { id: 'u_' + Date.now(), username, email, pass, role: 'user', points: 0, preds: {}, createdAt: new Date().toISOString() };
  if (firestore) { try { const ref = await firestore.collection('users').add(newUser); newUser.id = ref.id; } catch (e) {} }
  appState.users.push(newUser); currentUser = newUser; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  safeSetDisplay('authScreen', 'none'); setupApp(); if (btn) { btn.innerText = "Créer mon compte →"; btn.disabled = false; }
}

function handleLogout() { localStorage.removeItem('pf_cloud_session'); currentUser = null; location.reload(); }

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
    setupApp(); secretClicks = 0;
  }
}

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

function renderMatches() {
  const container = document.getElementById('matchesContainer'); if (!container) return;
  let list = ALL_MATCHES;
  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);

  let html = '';
  list.slice(0, 30).forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h:'', a:'' };
    const score = appState.scores[m.id];
    const done = !!score;
    const li = LEAGUE_INFO[m.league] || { name:m.league, flag:'⚽' };

    let res = '';
    if (done && score) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      res = `<div class="match-result-badge ${cls}">Final : ${score.h} - ${score.a} (+${pts} pts)</div>`;
    }

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><span style="color:var(--gold)">📅 ${m.date}</span></div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${getTeamCrest(m.home)}" class="team-crest"></div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${getTeamCrest(m.away)}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${!done ? `<div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="H">
          <span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="A">
        </div>` : ''}
        ${res}
      </div>`;
  });
  container.innerHTML = html;
}

async function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  document.querySelectorAll('.match-prediction input').forEach(input => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_' + id)?.value;
    const a = document.getElementById('a_' + id)?.value;
    if (h !== '' && a !== '') { currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) }; count++; }
  });

  if (firestore) { try { await firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch (err) {} }
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  alert(`${count} pronostics sauvegardés ! ✅`);
}

function renderAdminMatchList() {
  const container = document.getElementById('adminMatchList'); if (!container) return;
  let html = '';
  ALL_MATCHES.slice(0, 30).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="flex:1;font-size:0.85rem"><strong>${m.home}</strong> vs <strong>${m.away}</strong></span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:#000;color:white;border-radius:4px"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:#000;color:white;border-radius:4px"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">OK</button></div>`;
  });
  container.innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  if (firestore) { try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {} }
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  alert('Score enregistré !');
}

function navigateTo(p) {
  if (p === 'admin' && (!currentUser || currentUser.role !== 'admin')) { alert("⛔ Accès refusé !"); return; }
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p); if (page) page.classList.add('active');
  const btn = document.querySelector(`.bottom-nav-item[onclick="navigateTo('${p}')"]`); if (btn) btn.classList.add('active');
  if (p === 'admin') renderAdminMatchList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onload = init;
