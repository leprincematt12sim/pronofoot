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

const I18N = {
  fr: { auth_sub: "Saison 2026-27 — Multijoueur", btn_login_submit: "Se connecter", email: "Email / Pseudo", password: "Mot de passe", nav_home: "Accueil", nav_matches: "Matchs", nav_rank: "Classement", nav_admin: "Admin", my_points: "Mes Points", my_rank: "Mon Classement", btn_predict: "⚽ Pronostiquer les matchs", btn_save: "💾 Sauvegarder", welcome: "Bienvenue ! 👋" },
  en: { auth_sub: "Season 2026-27 — Multiplayer", btn_login_submit: "Log in", email: "Email / Username", password: "Password", nav_home: "Home", nav_matches: "Matches", nav_rank: "Rankings", nav_admin: "Admin", my_points: "My Points", my_rank: "My Rank", btn_predict: "⚽ Predict matches", btn_save: "💾 Save", welcome: "Welcome! 👋" },
  de: { auth_sub: "Saison 2026-27 — Mehrspieler", btn_login_submit: "Anmelden", email: "E-Mail / Benutzername", password: "Passwort", nav_home: "Start", nav_matches: "Spiele", nav_rank: "Tabelle", nav_admin: "Admin", my_points: "Meine Punkte", my_rank: "Mein Rang", btn_predict: "⚽ Spiele tippen", btn_save: "💾 Speichern", welcome: "Willkommen! 👋" }
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

let appState = {
  users: JSON.parse(localStorage.getItem('pf_users_v4')) || [
    { id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} },
    { id:'u1', username:'Alex_PL', email:'alex@test.com', pass:'123456', role:'user', points:45, preds:{} }
  ],
  scores: JSON.parse(localStorage.getItem('pf_scores_v4')) || {},
  settings: { themeColor: '#00E676' }
};

let currentUser = JSON.parse(localStorage.getItem('pf_session_v4')) || null;

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function calcPts(pred, score) {
  if (!pred || pred.h==='' || pred.a==='' || !score) return 0;
  if (pred.h===score.h && pred.a===score.a) return 5;
  const pR = pred.h>pred.a?'H':pred.h<pred.a?'A':'D';
  const sR = score.h>score.a?'H':score.h<score.a?'A':'D';
  return pR===sR?3:0;
}

function recalcAll() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds||{})) { const s = appState.scores[id]; if (s && s.status!=='LIVE') t += calcPts(p, s); }
    u.points = t;
  });
}

function getSorted() { return [...appState.users].sort((a,b) => b.points - a.points); }

function updateUI() {
  if (!currentUser) return;
  safeSetText('navPoints', currentUser.points + ' pts');
  safeSetText('statPoints', currentUser.points);
  const sorted = getSorted();
  const rank = sorted.findIndex(u => u.id === currentUser.id);
  safeSetText('statRank', rank >= 0 ? '#' + (rank+1) : '-');

  if (currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
  } else {
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('topAdminBtn').style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const found = appState.users.find(u => (u.email.toLowerCase() === em || u.username.toLowerCase() === em) && u.pass === pass);
  if (found) {
    currentUser = found; localStorage.setItem('pf_session_v4', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none'; setupApp();
  } else {
    document.getElementById('authError').textContent = I18N[currentLang]['err_login'] || 'Identifiant incorrect.'; document.getElementById('authError').style.display = 'block';
  }
}

function quickAdminLogin() {
  currentUser = appState.users.find(u => u.role === 'admin') || appState.users[0];
  localStorage.setItem('pf_session_v4', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none'; setupApp(); navigateTo('admin');
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  if (!container) return;
  let html = '';
  ALL_MATCHES.slice(0,20).forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || {h:'',a:''};
    const s = appState.scores[m.id];
    let res = '';
    if (s && s.status!=='LIVE') {
      const p = calcPts(pred, s);
      res = `<div style="text-align:center;color:var(--gold);font-weight:bold;margin-top:10px">SCORE FINAL : ${s.h} - ${s.a} (+${p})</div>`;
    }
    html += `
      <div class="match-card ${s&&s.status==='LIVE'?'is-live':''}">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px">${m.league} — ${m.date}</div>
        <div class="match-teams">
          <div style="flex:1;text-align:right">${m.home}</div>
          <div style="padding:0 15px;color:var(--accent)">VS</div>
          <div style="flex:1;text-align:left">${m.away}</div>
        </div>
        ${!s || s.status==='LIVE' ? `
        <div class="match-prediction">
          <input type="number" min="0" max="15" id="h_${m.id}" value="${pred.h}"><span>-</span><input type="number" min="0" max="15" id="a_${m.id}" value="${pred.a}">
        </div>` : ''}
        ${res}
      </div>`;
  });
  container.innerHTML = html;
}

function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  document.querySelectorAll('.match-prediction input').forEach(inp => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_'+id)?.value; const a = document.getElementById('a_'+id)?.value;
    if (h!==''&&a!=='') currentUser.preds[id] = { h:parseInt(h), a:parseInt(a) };
  });
  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_session_v4', JSON.stringify(currentUser));
  if (firestore) { try { firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch(e){} }
  recalcAll(); updateUI(); renderLeaderboard(); alert("✅ " + (I18N[currentLang]['success_save'] || "Sauvegardé !"));
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;
  const sorted = getSorted();
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pts</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    html += `<tr class="${isMe?'current-user':''}"><td>${medal}</td><td>${u.username} ${u.role==='admin'?'⭐':''}</td><td style="color:var(--gold);font-weight:bold">${u.points}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderAdminMatchList() {
  const c = document.getElementById('adminMatchList'); if(!c) return;
  const sV = (document.getElementById('adminSearchInput')?.value||'').toLowerCase();
  let l = ALL_MATCHES; if(sV) l = l.filter(m => m.home.toLowerCase().includes(sV) || m.away.toLowerCase().includes(sV));
  let html = '';
  l.slice(0,30).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="flex:1;font-size:0.85rem"><strong>${m.home}</strong> vs <strong>${m.away}</strong></span><input type="number" id="ah_${m.id}" value="${s?s.h:''}" style="width:40px;padding:5px;background:#000;color:white;border:1px solid var(--border);border-radius:4px;text-align:center"><input type="number" id="aa_${m.id}" value="${s?s.a:''}" style="width:40px;padding:5px;background:#000;color:white;border:1px solid var(--border);border-radius:4px;text-align:center"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">OK</button></div>`;
  });
  c.innerHTML = html;
}

function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_'+id)?.value); const a = parseInt(document.getElementById('aa_'+id)?.value);
  if (isNaN(h)||isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status:'FINISHED' };
  localStorage.setItem('pf_scores_v4', JSON.stringify(appState.scores));
  if (firestore) { try { firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch(e){} }
  recalcAll(); updateUI(); renderMatches(); renderLeaderboard(); renderAdminMatchList(); alert('Score enregistré !');
}

function changeTheme(c) {
  document.documentElement.style.setProperty('--accent', c);
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.remove('active')); event.target.classList.add('active');
}

function navigateTo(p) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p); if (page) page.classList.add('active');
  const btn = document.querySelector(`.bottom-nav-item[onclick="navigateTo('${p}')"]`); if (btn) btn.classList.add('active');
  if (p === 'admin') renderAdminMatchList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
  setLanguage('fr');
  if (currentUser) { document.getElementById('authScreen').style.display = 'none'; setupApp(); }
  else { document.getElementById('authScreen').style.display = 'flex'; }
}

function setupApp() {
  recalcAll(); updateUI(); renderMatches(); renderLeaderboard();
  if(currentUser && currentUser.role==='admin'){ document.getElementById('adminNavBtn').style.display='flex'; document.getElementById('topAdminBtn').style.display='block'; renderAdminMatchList(); }
}
window.onload = init;
