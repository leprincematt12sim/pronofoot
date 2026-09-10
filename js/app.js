// ==========================================
// BASE DE DONNÉES MATCHS 2026-27 (ÉCHANTILLON)
// ==========================================
const ALL_MATCHES = [
  { id: "pl_1", league: "Premier League", date: "21/08/2026", home: "Arsenal", away: "Coventry City" },
  { id: "pl_2", league: "Premier League", date: "22/08/2026", home: "Hull City", away: "Manchester United" },
  { id: "pl_3", league: "Premier League", date: "22/08/2026", home: "Brentford", away: "Tottenham" },
  { id: "pl_4", league: "Premier League", date: "23/08/2026", home: "Newcastle", away: "Liverpool" },
  { id: "pl_5", league: "Premier League", date: "28/08/2026", home: "Crystal Palace", away: "Manchester City" },
  { id: "l1_1", league: "Ligue 1", date: "21/08/2026", home: "Olympique de Marseille", away: "Strasbourg" },
  { id: "l1_2", league: "Ligue 1", date: "23/08/2026", home: "Rennes", away: "Paris Saint-Germain" },
  { id: "es_1", league: "La Liga", date: "16/08/2026", home: "FC Barcelone", away: "Athletic Bilbao" },
  { id: "es_2", league: "La Liga", date: "22/08/2026", home: "Espanyol", away: "Real Madrid" },
  { id: "c1_1", league: "Champions League", date: "14/10/2026", home: "Manchester City", away: "Paris Saint-Germain" },
  { id: "c1_2", league: "Champions League", date: "21/10/2026", home: "Real Madrid", away: "RB Leipzig" }
];

// Dictionnaire des Logos HD
const LOGOS = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Newcastle": "https://media.api-sports.io/football/teams/34.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png",
  "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png"
};

function getLogo(name) {
  return LOGOS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`;
}

// BDD LOCALE ROBUSTE (Remplacement de Firebase le temps de fixer les bugs)
let appState = {
  users: JSON.parse(localStorage.getItem('pf_pro_users')) || [
    { id: 'admin', username: 'Admin', email: 'admin@pronofoot.com', pass: 'admin123', role: 'admin', points: 0, preds: {} }
  ],
  scores: JSON.parse(localStorage.getItem('pf_pro_scores')) || {},
  session: localStorage.getItem('pf_pro_session') || null
};

let currentUser = null;

// ==========================================
// FONCTIONS DE BASE
// ==========================================
function saveDB() {
  localStorage.setItem('pf_pro_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_pro_scores', JSON.stringify(appState.scores));
}

function playSound(id) {
  try { document.getElementById('snd-' + id).play(); } catch(e) {}
}

function init() {
  if (appState.session) {
    currentUser = appState.users.find(u => u.id === appState.session);
  }
  
  if (currentUser) {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    setupApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
  }
}

// ==========================================
// AUTHENTIFICATION CORRIGÉE (RÉPARÉE !)
// ==========================================
function switchAuth(tab) {
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') {
    document.getElementById('tabLogin').style.background = 'var(--accent)';
    document.getElementById('tabLogin').style.color = '#000';
    document.getElementById('tabReg').style.background = '#2c2c2e';
    document.getElementById('tabReg').style.color = 'var(--text-main)';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  } else {
    document.getElementById('tabReg').style.background = 'var(--accent)';
    document.getElementById('tabReg').style.color = '#000';
    document.getElementById('tabLogin').style.background = '#2c2c2e';
    document.getElementById('tabLogin').style.color = 'var(--text-main)';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }
}
// Mettre le bouton login en couleur active par défaut
switchAuth('login');

function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  
  const found = appState.users.find(u => u.email.toLowerCase() === em && u.pass === pass);
  
  if (!found) {
    document.getElementById('authError').textContent = "Email ou mot de passe incorrect.";
    document.getElementById('authError').style.display = "block";
    return;
  }
  
  currentUser = found;
  localStorage.setItem('pf_pro_session', found.id);
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  setupApp();
}

function handleRegister(e) {
  e.preventDefault();
  const un = document.getElementById('regUser').value.trim();
  const em = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPass').value;
  
  if (appState.users.find(u => u.email.toLowerCase() === em)) {
    document.getElementById('authError').textContent = "Cet email est déjà utilisé.";
    document.getElementById('authError').style.display = "block";
    return;
  }
  
  const newUser = { id: 'u_'+Date.now(), username: un, email: em, pass: pass, role: 'user', points: 0, preds: {} };
  appState.users.push(newUser);
  saveDB();
  
  currentUser = newUser;
  localStorage.setItem('pf_pro_session', newUser.id);
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  setupApp();
}

function quickAdminLogin() {
  currentUser = appState.users.find(u => u.role === 'admin');
  localStorage.setItem('pf_pro_session', currentUser.id);
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  setupApp();
}

// ==========================================
// NAVIGATION & AFFICHAGE
// ==========================================
function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  
  document.getElementById('page-' + page).classList.add('active');
  const btn = document.querySelector(`.bottom-nav-item[onclick*="${page}"]`);
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupApp() {
  if (currentUser.role === 'admin') {
    document.getElementById('adminBtn').style.display = 'flex';
  }
  
  document.getElementById('navPoints').textContent = currentUser.points + ' pts';
  document.getElementById('navAvatar').textContent = currentUser.username[0].toUpperCase();
  document.getElementById('welcomeMsg').textContent = `Salut, ${currentUser.username} ! 👋`;
  
  document.getElementById('statPoints').textContent = currentUser.points;
  document.getElementById('statPreds').textContent = Object.keys(currentUser.preds || {}).length;
  
  renderMatches();
  if (currentUser.role === 'admin') renderAdminMatches();
}

// ==========================================
// MATCHS & COTES (GADGET)
// ==========================================
// Générer de fausses cotes réalistes basées sur un calcul mathématique simple
function generateOdds(home, away) {
  const h = (Math.random() * 2 + 1.1).toFixed(2);
  const a = (Math.random() * 3 + 2.5).toFixed(2);
  const d = (Math.random() * 1.5 + 3.0).toFixed(2);
  return { h, d, a };
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let html = '';
  
  ALL_MATCHES.forEach(m => {
    const pred = currentUser.preds[m.id] || { h:'', a:'' };
    const score = appState.scores[m.id];
    const odds = generateOdds(m.home, m.away);
    
    let resultOverlay = '';
    if (score) {
      let pts = 0;
      if (pred.h !== '' && pred.a !== '') {
        if (pred.h === score.h && pred.a === score.a) pts = 5;
        else if ((pred.h>pred.a && score.h>score.a) || (pred.h<pred.a && score.h<score.a) || (pred.h===pred.a && score.h===score.a)) pts = 3;
      }
      
      const col = pts === 5 ? 'var(--gold)' : pts === 3 ? 'var(--accent)' : 'var(--text-muted)';
      const txt = pts === 5 ? 'SCORE EXACT +5' : pts === 3 ? 'BON RÉSULTAT +3' : 'PERDU 0';
      
      resultOverlay = `
        <div style="margin-top:15px;padding:10px;border-radius:8px;background:#111;text-align:center;font-weight:900;color:${col}">
          FIN : ${score.h} - ${score.a} <br> <span style="font-size:0.75rem">${txt}</span>
        </div>`;
    }

    html += `
      <div class="match-card">
        <div class="match-header">
          <span>${m.league}</span>
          <span>${m.date}</span>
        </div>
        <div class="match-teams">
          <div class="team-name home"><span>${m.home}</span> <img src="${getLogo(m.home)}" class="team-logo"></div>
          <div class="match-inputs">
            <input type="number" id="h_${m.id}" value="${pred.h}" ${score?'disabled':''}>
            <span style="font-weight:900;color:var(--text-muted)">-</span>
            <input type="number" id="a_${m.id}" value="${pred.a}" ${score?'disabled':''}>
          </div>
          <div class="team-name away"><img src="${getLogo(m.away)}" class="team-logo"> <span>${m.away}</span></div>
        </div>
        ${!score ? `
        <div class="odds-container">
          <div class="odd-box">1 <span>${odds.h}</span></div>
          <div class="odd-box">N <span>${odds.d}</span></div>
          <div class="odd-box">2 <span>${odds.a}</span></div>
        </div>` : ''}
        ${resultOverlay}
      </div>`;
  });
  
  container.innerHTML = html;
}

function saveAll() {
  playSound('success');
  let count = 0;
  ALL_MATCHES.forEach(m => {
    const h = document.getElementById('h_' + m.id)?.value;
    const a = document.getElementById('a_' + m.id)?.value;
    if (h !== '' && a !== '') {
      currentUser.preds[m.id] = { h: parseInt(h), a: parseInt(a) };
      count++;
    }
  });
  
  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  appState.users[idx] = currentUser;
  saveDB();
  setupApp();
  
  // Petit effet visuel
  const btn = document.querySelector('button[onclick="saveAll()"]');
  btn.textContent = "✅ " + count + " Enregistrés";
  btn.style.background = "var(--gold)";
  setTimeout(() => { btn.textContent = "Valider 💾"; btn.style.background = "var(--accent)"; }, 2000);
}

// ==========================================
// ADMIN (SCORES ET CALCUL)
// ==========================================
function renderAdminMatches() {
  const container = document.getElementById('adminMatchList');
  let html = '';
  ALL_MATCHES.forEach(m => {
    const s = appState.scores[m.id];
    html += `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border)">
        <div style="flex:1;font-size:0.85rem"><strong>${m.home}</strong> vs <strong>${m.away}</strong></div>
        <input type="number" id="adm_h_${m.id}" value="${s?s.h:''}" style="width:40px;padding:5px;background:#111;color:white;border:1px solid var(--border);border-radius:4px;text-align:center">
        <input type="number" id="adm_a_${m.id}" value="${s?s.a:''}" style="width:40px;padding:5px;background:#111;color:white;border:1px solid var(--border);border-radius:4px;text-align:center">
        <button class="btn btn-primary btn-xs" onclick="saveScore('${m.id}')">OK</button>
      </div>`;
  });
  container.innerHTML = html;
}

function saveScore(id) {
  const h = parseInt(document.getElementById('adm_h_' + id).value);
  const a = parseInt(document.getElementById('adm_a_' + id).value);
  if (!isNaN(h) && !isNaN(a)) {
    appState.scores[id] = { h, a };
    recalcPoints();
    saveDB();
    setupApp();
    alert('Score enregistré ! Points mis à jour.');
  }
}

function simulateScores() {
  ALL_MATCHES.slice(0,5).forEach(m => {
    if (!appState.scores[m.id]) appState.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3) };
  });
  recalcPoints();
  saveDB();
  setupApp();
}

function resetScores() {
  appState.scores = {};
  recalcPoints();
  saveDB();
  setupApp();
}

function recalcPoints() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds)) {
      const s = appState.scores[id];
      if (s) {
        if (p.h === s.h && p.a === s.a) t += 5;
        else if ((p.h>p.a && s.h>s.a) || (p.h<p.a && s.h<s.a) || (p.h===p.a && s.h===s.a)) t += 3;
      }
    }
    u.points = t;
  });
}

window.onload = init;
