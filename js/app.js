// ============================================
// PRONOFOOT — MOTEUR COMPLET v2
// Scores manuels + auto, recalcul instantané
// ============================================

const BONUS_CONFIG = [
  { id:'ucl_win', label:'🏆 Vainqueur Ligue des Champions', pts:75, teams:['Real Madrid','FC Barcelone','Manchester City','Bayern Munich','Paris Saint-Germain','Arsenal','Liverpool','Inter Milan','Borussia Dortmund','Atlético Madrid'] },
  { id:'pl_win', label:'🏴 Champion Premier League', pts:50, teams:['Manchester City','Arsenal','Liverpool','Manchester United','Tottenham','Newcastle'] },
  { id:'liga_win', label:'🇪🇸 Champion La Liga', pts:50, teams:['Real Madrid','FC Barcelone','Atlético Madrid'] },
  { id:'seriea_win', label:'🇮🇹 Champion Serie A', pts:50, teams:['Inter Milan','Juventus','AC Milan','Naples'] },
  { id:'buli_win', label:'🇩🇪 Champion Bundesliga', pts:50, teams:['Bayern Munich','Borussia Dortmund'] },
  { id:'l1_win', label:'🇫🇷 Champion Ligue 1', pts:50, teams:['Paris Saint-Germain','Olympique de Marseille'] }
];

const LEAGUE_INFO = {
  champions: { name:'Ligue des Champions', flag:'🏆' },
  premier: { name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  laliga: { name:'La Liga', flag:'🇪🇸' },
  seriea: { name:'Serie A', flag:'🇮🇹' },
  bundesliga: { name:'Bundesliga', flag:'🇩🇪' },
  ligue1: { name:'Ligue 1', flag:'🇫🇷' }
};

// === BASE DE DONNÉES ===
let db = {
  users: JSON.parse(localStorage.getItem('pf_users')) || [
    { id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{}, bonuses:{} },
    { id:'u1', username:'Alex_PL', email:'alex@test.com', pass:'123456', role:'user', points:0, preds:{}, bonuses:{} },
    { id:'u2', username:'Sophie_L1', email:'sophie@test.com', pass:'123456', role:'user', points:0, preds:{}, bonuses:{} },
    { id:'u3', username:'Marco_SerieA', email:'marco@test.com', pass:'123456', role:'user', points:0, preds:{}, bonuses:{} },
    { id:'u4', username:'Karim_UCL', email:'karim@test.com', pass:'123456', role:'user', points:0, preds:{}, bonuses:{} }
  ],
  scores: JSON.parse(localStorage.getItem('pf_scores')) || {},
  session: localStorage.getItem('pf_session') || null,
  announce: localStorage.getItem('pf_announce') || ''
};

let currentUser = null;
let currentLeague = 'all';
let adminLeagueFilter = 'all';

// === DÉMARRAGE ===
function init() {
  if (db.session) currentUser = db.users.find(u => u.id === db.session);
  if (!currentUser) {
    document.getElementById('authScreen').style.display = 'flex';
  } else {
    document.getElementById('authScreen').style.display = 'none';
    recalcAllPoints();
    setupApp();
  }
}

function setupApp() {
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderBonuses();
  if (currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    renderAdminMatchList();
    renderAdminStats();
  }
  if (db.announce) {
    document.getElementById('announcementBox').style.display = 'block';
    document.getElementById('announcementText').textContent = db.announce;
  }
}

function saveDB() {
  localStorage.setItem('pf_users', JSON.stringify(db.users));
  localStorage.setItem('pf_scores', JSON.stringify(db.scores));
}

// === AUTH ===
function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const found = db.users.find(x => (x.username.toLowerCase()===u.toLowerCase() || x.email.toLowerCase()===u.toLowerCase()) && x.pass===p);
  if (!found) {
    const err = document.getElementById('authError');
    err.textContent = 'Identifiant ou mot de passe incorrect.';
    err.style.display = 'block';
    return;
  }
  currentUser = found;
  localStorage.setItem('pf_session', found.id);
  document.getElementById('authScreen').style.display = 'none';
  recalcAllPoints();
  setupApp();
}

function handleRegister(e) {
  e.preventDefault();
  const u = document.getElementById('regUser').value.trim();
  const em = document.getElementById('regEmail').value.trim();
  const p = document.getElementById('regPass').value;
  if (db.users.find(x => x.username.toLowerCase()===u.toLowerCase())) {
    const err = document.getElementById('authError');
    err.textContent = 'Ce pseudo est déjà pris.';
    err.style.display = 'block';
    return;
  }
  const nu = { id:'u_'+Date.now(), username:u, email:em, pass:p, role:'user', points:0, preds:{}, bonuses:{} };
  db.users.push(nu);
  saveDB();
  currentUser = nu;
  localStorage.setItem('pf_session', nu.id);
  document.getElementById('authScreen').style.display = 'none';
  setupApp();
}

function handleLogout() {
  localStorage.removeItem('pf_session');
  location.reload();
}

// === CALCUL DES POINTS (AUTOMATIQUE) ===
function calcPts(pred, score) {
  if (!pred || pred.h==='' || pred.a==='' || !score) return 0;
  if (pred.h===score.h && pred.a===score.a) return 5;
  const pR = pred.h>pred.a ? 'H' : pred.h<pred.a ? 'A' : 'D';
  const sR = score.h>score.a ? 'H' : score.h<score.a ? 'A' : 'D';
  if (pR===sR) return 3;
  return 0;
}

function recalcAllPoints() {
  db.users.forEach(u => {
    let total = 0;
    for (const [id, pred] of Object.entries(u.preds || {})) {
      const score = db.scores[id];
      if (score) total += calcPts(pred, score);
    }
    u.points = total;
  });
  saveDB();
}

// === UI ===
function updateUI() {
  if (!currentUser) return;
  document.getElementById('navPoints').textContent = '⭐ ' + currentUser.points + ' pts';
  document.getElementById('navAvatar').textContent = currentUser.username[0].toUpperCase();
  document.getElementById('welcomeMsg').textContent = 'Bienvenue, ' + currentUser.username + ' ! 👋';
  document.getElementById('statPoints').textContent = currentUser.points;
  document.getElementById('statPredictions').textContent = Object.keys(currentUser.preds||{}).length;

  let exact = 0;
  for (const [id, pred] of Object.entries(currentUser.preds||{})) {
    const s = db.scores[id];
    if (s && pred.h===s.h && pred.a===s.a) exact++;
  }
  document.getElementById('statExact').textContent = exact;

  const sorted = [...db.users].sort((a,b) => b.points-a.points);
  const rank = sorted.findIndex(u => u.id===currentUser.id);
  document.getElementById('statRank').textContent = rank>=0 ? '#'+(rank+1) : '-';

  document.getElementById('profileBigAvatar').textContent = currentUser.username[0].toUpperCase();
  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent = currentUser.role==='admin' ? '⭐ Administrateur' : 'Joueur';
}

// === MATCHS ===
function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;
  if (currentLeague!=='all') list = ALL_MATCHES.filter(m => m.league===currentLeague);

  let html = '';
  list.forEach(m => {
    const pred = (currentUser.preds && currentUser.preds[m.id]) || {h:'',a:''};
    const score = db.scores[m.id];
    const done = !!score;
    const li = LEAGUE_INFO[m.league] || {name:m.league,flag:'⚽'};

    let resHtml = '';
    if (done) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Score Exact +5':pts===3?'✅ Bon résultat +3':'❌ Raté 0';
      resHtml = `<div class="match-result-badge ${cls}">Final: ${score.h}-${score.a} | ${lbl}</div>`;
    }

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header">
          <span>${li.flag} <strong>${li.name}</strong></span>
          <span style="color:var(--gold)">📅 ${m.date}</span>
        </div>
        <div class="match-teams">
          <div class="match-team home">${m.home}</div>
          <div class="match-vs">${done?score.h+' - '+score.a:'VS'}</div>
          <div class="match-team away">${m.away}</div>
        </div>
        ${!done?`
        <div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="-">
          <span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="-">
        </div>`:''}
        ${resHtml}
      </div>`;
  });
  container.innerHTML = html;
}

function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  document.querySelectorAll('.match-prediction input').forEach(input => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_'+id)?.value;
    const a = document.getElementById('a_'+id)?.value;
    if (h!=='' && a!=='') {
      currentUser.preds[id] = {h:parseInt(h), a:parseInt(a)};
      count++;
    }
  });
  const idx = db.users.findIndex(u => u.id===currentUser.id);
  if (idx!==-1) db.users[idx] = currentUser;
  recalcAllPoints();
  saveDB();
  updateUI();
  renderLeaderboard();
  alert(count+' pronostics sauvegardés ! ✅');
}

// === CLASSEMENT ===
function renderLeaderboard() {
  const sorted = [...db.users].sort((a,b) => b.points-a.points);
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>Exact</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u,i) => {
    const isMe = currentUser && u.id===currentUser.id;
    let ex = 0;
    for (const [id,p] of Object.entries(u.preds||{})) {
      const s = db.scores[id];
      if (s && p.h===s.h && p.a===s.a) ex++;
    }
    html += `<tr class="${isMe?'current-user':''}">
      <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</td>
      <td>${u.username} ${u.role==='admin'?'⭐':''}</td>
      <td>${Object.keys(u.preds||{}).length}</td>
      <td>${ex}</td>
      <td>${u.points} pts</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

// === BONUS ===
function renderBonuses() {
  const c = document.getElementById('bonusesContainer');
  const mb = currentUser.bonuses||{};
  c.innerHTML = BONUS_CONFIG.map(b => {
    const sel = mb[b.id]||'';
    const opts = b.teams.map(t => `<option value="${t}" ${t===sel?'selected':''}>${t}</option>`).join('');
    return `<div class="admin-card">
      <h4 style="font-size:0.95rem">${b.label} <span style="color:var(--gold)">(+${b.pts})</span></h4>
      <select id="bonus_${b.id}" style="width:100%;margin-top:8px;padding:8px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:6px">
        <option value="">-- Choisir --</option>${opts}
      </select>
    </div>`;
  }).join('');
}

function saveBonuses() {
  if (!currentUser) return;
  if (!currentUser.bonuses) currentUser.bonuses = {};
  BONUS_CONFIG.forEach(b => {
    const v = document.getElementById('bonus_'+b.id)?.value;
    if (v) currentUser.bonuses[b.id] = v;
  });
  const idx = db.users.findIndex(u => u.id===currentUser.id);
  if (idx!==-1) db.users[idx] = currentUser;
  saveDB();
  alert('Bonus sauvegardés ! 🎯');
}

// ============================================
// PANNEAU ADMIN — SCORES & RECALCUL AUTO
// ============================================

function adminFilterMatches(league) {
  adminLeagueFilter = league;
  renderAdminMatchList();
}

function renderAdminMatchList() {
  const container = document.getElementById('adminMatchList');
  let list = ALL_MATCHES;
  if (adminLeagueFilter!=='all') list = ALL_MATCHES.filter(m => m.league===adminLeagueFilter);

  let html = '';
  list.forEach(m => {
    const score = db.scores[m.id];
    const li = LEAGUE_INFO[m.league]||{flag:'⚽',name:m.league};
    const hVal = score ? score.h : '';
    const aVal = score ? score.a : '';
    const statusColor = score ? 'var(--green)' : 'var(--text-dim)';
    const statusText = score ? '✅ Terminé' : '⏳ En attente';

    html += `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span>
        <span style="font-size:0.7rem">${li.flag}</span>
        <span style="flex:1;font-size:0.85rem;min-width:150px">${m.home} vs ${m.away}</span>
        <input type="number" min="0" max="15" value="${hVal}" id="ah_${m.id}" placeholder="H"
          style="width:40px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold">
        <span style="color:var(--text-dim)">-</span>
        <input type="number" min="0" max="15" value="${aVal}" id="aa_${m.id}" placeholder="A"
          style="width:40px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold">
        <button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">OK</button>
        <span style="font-size:0.7rem;color:${statusColor}">${statusText}</span>
      </div>`;
  });
  container.innerHTML = html;
}

// SAUVEGARDER UN SCORE → RECALCUL AUTO INSTANTANÉ
function adminSaveScore(matchId) {
  const h = parseInt(document.getElementById('ah_'+matchId)?.value);
  const a = parseInt(document.getElementById('aa_'+matchId)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }

  db.scores[matchId] = { h, a };
  recalcAllPoints();
  saveDB();

  // Rafraîchir TOUT instantanément
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
}

// SIMULER 10 SCORES
function adminSimulateScores() {
  let count = 0;
  const unscored = ALL_MATCHES.filter(m => !db.scores[m.id]);
  unscored.slice(0, 10).forEach(m => {
    db.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3) };
    count++;
  });
  recalcAllPoints();
  saveDB();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert(count+' scores simulés ! Points recalculés automatiquement. 🎲');
}

// SIMULER TOUS LES SCORES
function adminSimulateAll() {
  if (!confirm('Simuler les scores de TOUS les matchs ?')) return;
  let count = 0;
  ALL_MATCHES.forEach(m => {
    if (!db.scores[m.id]) {
      db.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3) };
      count++;
    }
  });
  recalcAllPoints();
  saveDB();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert(count+' scores simulés ! 🎲');
}

// RÉINITIALISER
function adminResetScores() {
  if (!confirm('Supprimer tous les scores et recalculer ?')) return;
  db.scores = {};
  recalcAllPoints();
  saveDB();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert('Scores réinitialisés ! 🗑️');
}

// STATS ADMIN
function renderAdminStats() {
  const total = ALL_MATCHES.length;
  const scored = Object.keys(db.scores).length;
  const totalPreds = db.users.reduce((sum,u) => sum + Object.keys(u.preds||{}).length, 0);

  document.getElementById('adminStats').innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs totaux</span><strong>${total}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Scores entrés</span><strong style="color:var(--green)">${scored}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs restants</span><strong style="color:var(--accent)">${total-scored}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Joueurs inscrits</span><strong>${db.users.length}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Pronostics totaux</span><strong style="color:var(--gold)">${totalPreds}</strong></div>
  `;
}

// === AUTRES ===
function adminPublishAnnouncement() {
  const t = document.getElementById('adminAnnounceInput').value.trim();
  if (!t) return;
  db.announce = t;
  localStorage.setItem('pf_announce', t);
  document.getElementById('announcementBox').style.display = 'block';
  document.getElementById('announcementText').textContent = t;
  alert('Annonce publiée ! 📢');
}

function changeTheme(c) {
  document.documentElement.style.setProperty('--accent', c);
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  event.target.classList.add('active');
}

function filterLeague(l) {
  currentLeague = l;
  document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderMatches();
}

function navigateTo(p) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  if (p==='admin') { renderAdminMatchList(); renderAdminStats(); }
  window.scrollTo({top:0,behavior:'smooth'});
}

window.onload = init;
