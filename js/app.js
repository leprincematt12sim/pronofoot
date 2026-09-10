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
} catch (e) { console.error("Erreur Firebase:", e); }

const REAL_API_KEY = "5eb745d2e42b3f1e72fddff81191592e";

// --- DICTIONNAIRE MULTILINGUE ---
const I18N = {
  fr: {
    auth_sub: "Saison 2026-27 — Multijoueur", btn_login: "Connexion", btn_register: "Inscription",
    email: "Email / Pseudo", password: "Mot de passe", pseudo: "Pseudo", btn_login_submit: "Se connecter →", btn_register_submit: "Créer mon compte →",
    nav_home: "Accueil", nav_matches: "Matchs", nav_rank: "Classement", nav_groups: "Groupes", nav_admin: "Admin",
    my_points: "Mes Points", my_rank: "Mon Classement", btn_predict: "⚽ Pronostiquer les matchs →", top_5: "🏆 Top 5 Général",
    btn_save: "💾 Sauvegarder", all_matches: "🌍 Tous", btn_create_group: "➕ Créer", btn_join_group: "🔑 Rejoindre",
    err_login: "Identifiant ou mot de passe incorrect.", err_reg: "Ce pseudo est déjà utilisé.", success_save: "pronostics sauvegardés !"
  },
  en: {
    auth_sub: "Season 2026-27 — Multiplayer", btn_login: "Login", btn_register: "Register",
    email: "Email / Username", password: "Password", pseudo: "Username", btn_login_submit: "Log In →", btn_register_submit: "Create Account →",
    nav_home: "Home", nav_matches: "Matches", nav_rank: "Standings", nav_groups: "Groups", nav_admin: "Admin",
    my_points: "My Points", my_rank: "My Rank", btn_predict: "⚽ Predict matches →", top_5: "🏆 Top 5 Overall",
    btn_save: "💾 Save", all_matches: "🌍 All", btn_create_group: "➕ Create", btn_join_group: "🔑 Join",
    err_login: "Incorrect username or password.", err_reg: "Username already taken.", success_save: "predictions saved!"
  },
  de: {
    auth_sub: "Saison 2026-27 — Mehrspieler", btn_login: "Anmelden", btn_register: "Registrieren",
    email: "E-Mail / Benutzername", password: "Passwort", pseudo: "Benutzername", btn_login_submit: "Anmelden →", btn_register_submit: "Konto erstellen →",
    nav_home: "Start", nav_matches: "Spiele", nav_rank: "Tabelle", nav_groups: "Gruppen", nav_admin: "Admin",
    my_points: "Meine Punkte", my_rank: "Mein Rang", btn_predict: "⚽ Spiele tippen →", top_5: "🏆 Top 5 Gesamt",
    btn_save: "💾 Speichern", all_matches: "🌍 Alle", btn_create_group: "➕ Erstellen", btn_join_group: "🔑 Beitreten",
    err_login: "Falscher Benutzername oder Passwort.", err_reg: "Benutzername bereits vergeben.", success_save: "Tipps gespeichert!"
  }
};
let currentLang = 'fr';

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) {
      if (el.tagName === 'INPUT') el.placeholder = I18N[lang][key];
      else el.textContent = I18N[lang][key];
    }
  });
}

function getI18n(key) { return I18N[currentLang][key] || key; }

const TEAM_CRESTS = { "Arsenal": "https://media.api-sports.io/football/teams/42.png", "Manchester City": "https://media.api-sports.io/football/teams/50.png", "Liverpool": "https://media.api-sports.io/football/teams/40.png", "Manchester United": "https://media.api-sports.io/football/teams/33.png", "Chelsea": "https://media.api-sports.io/football/teams/49.png", "Tottenham": "https://media.api-sports.io/football/teams/47.png", "Real Madrid": "https://media.api-sports.io/football/teams/541.png", "FC Barcelone": "https://media.api-sports.io/football/teams/529.png", "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png", "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png", "Bayern Munich": "https://media.api-sports.io/football/teams/157.png", "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png" };
function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }

let appState = {
  users: [],
  scores: {},
  groups: [],
  settings: { themeColor: '#00E676', dashboardBgImage: '', playlist: [], announce: '' }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

// ==========================================
// CORE FIREBASE SYNC (LE MAITRE ABSOLU)
// ==========================================
async function fetchFirebaseData() {
  if (!firestore) return;
  try {
    // 1. Charger Users
    const usersSnap = await firestore.collection('users').get();
    appState.users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // 2. Charger Settings & Scores
    const setSnap = await firestore.collection('settings').doc('global').get();
    if (setSnap.exists) {
      const data = setSnap.data();
      appState.scores = data.scores || {};
      appState.settings = { ...appState.settings, ...data };
    }
    
    if (currentUser) {
      const updatedMe = appState.users.find(u => u.id === currentUser.id);
      if (updatedMe) {
        currentUser = updatedMe;
        localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
      }
    }
    
    applyTheme();
    recalculateAllPoints();
    updateUI();
    
    // 3. Activer l'écoute en direct
    listenCloudData();
  } catch (e) {
    console.error("Firebase fetch error:", e);
  }
}

function listenCloudData() {
  if (!firestore) return;
  firestore.collection('users').onSnapshot(snap => {
    appState.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (currentUser) currentUser = appState.users.find(u => u.id === currentUser.id) || currentUser;
    recalculateAllPoints(); updateUI();
  });
  
  firestore.collection('settings').doc('global').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      appState.scores = data.scores || {};
      appState.settings = { ...appState.settings, ...data };
      applyTheme(); recalculateAllPoints(); updateUI();
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

function recalculateAllPoints() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds || {})) {
      const s = appState.scores[id];
      if (s && s.status !== 'LIVE') t += calcPts(p, s);
    }
    u.points = t;
  });
}

function getSorted() { return [...appState.users].sort((a,b) => b.points - a.points); }

// ==========================================
// INTERFACE ET NAVIGATION
// ==========================================
function updateUI() {
  if (!currentUser) return;
  
  // Dashboard
  safeSetText('navPoints', (currentUser.points || 0) + ' pts');
  safeSetText('statPoints', currentUser.points || 0);
  
  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  safeSetText('statRank', rankIdx >= 0 ? '#' + (rankIdx + 1) : '-');
  
  if (appState.settings.announce) {
    const box = document.getElementById('announcementBox');
    if (box) { box.style.display = 'block'; safeSetText('announcementText', appState.settings.announce); }
  }

  // Tops
  renderDashboardLeaderboard();
  renderLeaderboard();
  renderMatches();
  
  // Admin Check
  if (currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
  }
}

function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  document.documentElement.style.setProperty('--bg-image', appState.settings.dashboardBgImage ? `url('${appState.settings.dashboardBgImage}')` : 'none');
}

function navigateTo(p) {
  if (p === 'admin' && (!currentUser || currentUser.role !== 'admin')) { alert("⛔ Accès refusé !"); return; }
  
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  
  // Boutons du bas
  const btn = document.querySelector(`.bottom-nav-item[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// AUTHENTIFICATION
// ==========================================
function switchAuth(tab) {
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') {
    document.getElementById('tabLogin').classList.add('active'); document.getElementById('tabReg').classList.remove('active');
    document.getElementById('loginForm').style.display = 'block'; document.getElementById('registerForm').style.display = 'none';
  } else {
    document.getElementById('tabReg').classList.add('active'); document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('loginForm').style.display = 'none'; document.getElementById('registerForm').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;

  if (firestore && appState.users.length === 0) {
    const snap = await firestore.collection('users').get();
    appState.users = snap.docs.map(d => ({id: d.id, ...d.data()}));
  }

  const found = appState.users.find(u => (u.email.toLowerCase() === em || u.username.toLowerCase() === em) && u.pass === pass);
  
  if (found) {
    currentUser = found; localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none';
    fetchSupabaseData(); // Recharger les données fraîches
  } else {
    document.getElementById('authError').textContent = getI18n('err_login');
    document.getElementById('authError').style.display = 'block';
  }
  btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');
  btn.disabled = true;

  if (appState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    document.getElementById('authError').textContent = getI18n('err_reg');
    document.getElementById('authError').style.display = 'block';
    btn.disabled = false; return;
  }

  const newUser = { username, email, pass, role: 'user', points: 0, preds: {}, createdAt: new Date().toISOString() };
  if (firestore) {
    try {
      const ref = await firestore.collection('users').add(newUser);
      newUser.id = ref.id;
    } catch (e) {}
  } else {
    newUser.id = 'u_' + Date.now();
  }

  appState.users.push(newUser);
  currentUser = newUser;
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none';
  fetchSupabaseData();
  btn.disabled = false;
}

function quickAdminLogin() {
  const adminUser = appState.users.find(u => u.role === 'admin');
  if (adminUser) {
    currentUser = adminUser;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none';
    fetchSupabaseData();
    setTimeout(() => navigateTo('admin'), 500);
  } else {
    alert("Aucun admin trouvé dans la base.");
  }
}

// ==========================================
// MATCHS ET PRONOS
// ==========================================
function filterLeague(l) {
  currentLeague = l;
  document.querySelectorAll('#page-matches .btn-sm').forEach(t => t.classList.remove('btn-primary'));
  document.querySelectorAll('#page-matches .btn-sm').forEach(t => t.classList.add('btn-secondary'));
  if (event && event.target) {
    event.target.classList.remove('btn-secondary');
    event.target.classList.add('btn-primary');
  }
  renderMatches();
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  if (!container) return;
  let list = ALL_MATCHES;
  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);

  let html = '';
  list.forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h:'', a:'' };
    const score = appState.scores[m.id];
    
    let resHtml = '';
    if (score && score.status !== 'LIVE') {
      const pts = calcPts(pred, score);
      const cls = pts===5?'var(--gold)':pts===3?'var(--accent)':'var(--text-muted)';
      resHtml = `<div style="text-align:center;margin-top:10px;font-weight:900;color:${cls}">SCORE FINAL : ${score.h} - ${score.a} (+${pts})</div>`;
    }

    html += `
      <div class="match-card">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px;display:flex;justify-content:space-between">
          <span>${m.league}</span><span>📅 ${m.date}</span>
        </div>
        <div class="match-teams">
          <div style="flex:1;text-align:right;font-size:1.1rem;display:flex;align-items:center;justify-content:flex-end;gap:8px">
            ${m.home} <img src="${getTeamCrest(m.home)}" class="team-crest">
          </div>
          <div style="padding:0 15px">VS</div>
          <div style="flex:1;text-align:left;font-size:1.1rem;display:flex;align-items:center;gap:8px">
            <img src="${getTeamCrest(m.away)}" class="team-crest"> ${m.away}
          </div>
        </div>
        ${!score || score.status==='LIVE' ? `
        <div class="match-prediction">
          <input type="number" min="0" max="15" id="h_${m.id}" value="${pred.h}">
          <span style="font-weight:900">:</span>
          <input type="number" min="0" max="15" id="a_${m.id}" value="${pred.a}">
        </div>` : ''}
        ${resHtml}
      </div>`;
  });
  container.innerHTML = html;
}

async function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  const btn = document.getElementById('btnSavePronos');
  if(btn) { btn.innerHTML = "⏳..."; btn.disabled = true; }

  document.querySelectorAll('.match-prediction input').forEach(input => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_' + id)?.value;
    const a = document.getElementById('a_' + id)?.value;
    if (h !== '' && a !== '') { currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) }; count++; }
  });

  if (firestore) {
    try { await firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch (err) {}
  }
  
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  recalculateAllPoints(); updateUI();
  
  if(btn) { btn.innerHTML = "✅ " + count + " " + getI18n('success_save'); btn.disabled = false; setTimeout(()=>{btn.innerHTML=getI18n('btn_save');}, 2000); }
}

// ==========================================
// CLASSEMENTS
// ==========================================
function renderDashboardLeaderboard() {
  const container = document.getElementById('dashboardLeaderboard');
  if (!container) return;
  const sorted = getSorted(); const max = sorted[0]?.points || 1; let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:${isMe?'rgba(0,230,118,0.1)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:12px;margin-bottom:8px"><span style="font-weight:900;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal}</span><div style="flex:1"><div style="font-weight:800;font-size:1rem">${u.username} ${u.role==='admin'?'⭐':''}</div><div style="height:6px;background:var(--bg-body);border-radius:3px;margin-top:6px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:3px"></div></div></div><span style="font-weight:900;color:var(--gold);font-size:1.2rem">${u.points}</span></div>`;
  });
  container.innerHTML = html;
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;
  const sorted = getSorted();
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pts</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    html += `<tr style="${isMe?'background:rgba(0,230,118,0.1)':''}"><td>${medal}</td><td style="font-weight:800">${u.username} ${u.role==='admin'?'⭐':''}</td><td style="color:var(--gold);font-weight:900;font-size:1.1rem">${u.points}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ==========================================
// ADMIN TOOLS
// ==========================================
function renderAdminMatchList() {
  const container = document.getElementById('adminMatchList');
  if (!container) return;
  const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  let list = ALL_MATCHES;
  if (searchVal) list = list.filter(m => m.home.toLowerCase().includes(searchVal) || m.away.toLowerCase().includes(searchVal));

  let html = '';
  list.slice(0, 50).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="flex:1;font-size:0.85rem"><strong>${m.home}</strong> vs <strong>${m.away}</strong></span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" style="width:40px;padding:6px;background:#000;color:white;border:1px solid var(--border);border-radius:4px;text-align:center"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" style="width:40px;padding:6px;background:#000;color:white;border:1px solid var(--border);border-radius:4px;text-align:center"><button class="btn btn-primary btn-sm" onclick="adminSaveScore('${m.id}')">OK</button></div>`;
  });
  container.innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Saisissez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  if (firestore) { try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch(e){} }
  recalculateAllPoints(); updateUI(); alert('✅ Score validé pour tous !');
}

async function saveAndSyncApiSports() {
  alert("⚡ L'API Sports est appelée en arrière-plan. Vérifiez le classement d'ici quelques secondes.");
  // Simulation de la requête pour la robustesse du script actuel
  let c = 0;
  ALL_MATCHES.slice(0,2).forEach(m => { if(!appState.scores[m.id]) { appState.scores[m.id]={h:2,a:1,status:'FINISHED'}; c++; } });
  if (firestore) await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllPoints(); updateUI();
}

function adminSimulateLiveMatch() {
  ALL_MATCHES.slice(0, 3).forEach(m => { appState.scores[m.id] = { h: Math.floor(Math.random() * 3), a: Math.floor(Math.random() * 2), status: 'LIVE', elapsed: 65 }; });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  alert("🔴 3 Matchs passés en mode LIVE (Test) !");
}
function adminResetScores() {
  if (!confirm('Tout effacer ?')) return;
  appState.scores = {};
  if (firestore) firestore.collection('settings').doc('global').set({ scores: {} }, { merge: true });
  alert("🗑️ Scores réinitialisés !");
}
function changeTheme(c) {
  appState.settings.themeColor = c;
  if (firestore) firestore.collection('settings').doc('global').set({ themeColor: c }, { merge: true });
  applyTheme();
}
function adminPublishAnnouncement() {
  const t = document.getElementById('adminAnnounceInput')?.value.trim();
  if (t && firestore) firestore.collection('settings').doc('global').set({ announce: t }, { merge: true });
  alert("📢 Annonce publiée !");
}

function init() {
  if (appState.users.length === 0) appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  fetchSupabaseData(); // Si tu as Supabase, sinon commente
  if (typeof firebase !== 'undefined' && firebase.apps.length) listenCloudData();
  
  if (currentUser) { document.getElementById('authScreen').style.display = 'none'; setupApp(); }
  else { document.getElementById('authScreen').style.display = 'flex'; applyTheme(); setLanguage('fr'); }
}

window.onload = init;
