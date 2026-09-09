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
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Newcastle": "https://media.api-sports.io/football/teams/34.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Atlético Madrid": "https://media.api-sports.io/football/teams/530.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png",
  "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Inter Milan": "https://media.api-sports.io/football/teams/505.png",
  "AC Milan": "https://media.api-sports.io/football/teams/489.png",
  "Juventus": "https://media.api-sports.io/football/teams/496.png",
  "Naples": "https://media.api-sports.io/football/teams/492.png",
  "AS Rome": "https://media.api-sports.io/football/teams/497.png"
};

const BONUS_CONFIG = [
  { id:'ucl_win', label:'🏆 Vainqueur Ligue des Champions 2026-27', pts:75, teams:['Real Madrid','FC Barcelone','Manchester City','Bayern Munich','Paris Saint-Germain','Arsenal','Liverpool','Inter Milan','Borussia Dortmund','Atlético Madrid'] },
  { id:'pl_win', label:'🏴 Champion Premier League 2026-27', pts:50, teams:['Manchester City','Arsenal','Liverpool','Manchester United','Tottenham','Newcastle'] },
  { id:'liga_win', label:'🇪🇸 Champion La Liga 2026-27', pts:50, teams:['Real Madrid','FC Barcelone','Atlético Madrid'] },
  { id:'seriea_win', label:'🇮🇹 Champion Serie A 2026-27', pts:50, teams:['Inter Milan','Juventus','AC Milan','Naples'] },
  { id:'buli_win', label:'🇩🇪 Champion Bundesliga 2026-27', pts:50, teams:['Bayern Munich','Borussia Dortmund'] },
  { id:'l1_win', label:'🇫🇷 Champion Ligue 1 2026-27', pts:50, teams:['Paris Saint-Germain','Olympique de Marseille'] }
];

const LEAGUE_INFO = {
  champions:{ name:'Ligue des Champions', flag:'🏆', accent:'#f5c518', defaultBanner:'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1920&q=80' },
  premier:{ name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent:'#3d195b', defaultBanner:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1920&q=80' },
  laliga:{ name:'La Liga', flag:'🇪🇸', accent:'#ee8707', defaultBanner:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80' },
  seriea:{ name:'Serie A', flag:'🇮🇹', accent:'#024494', defaultBanner:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1920&q=80' },
  bundesliga:{ name:'Bundesliga', flag:'🇩🇪', accent:'#d20515', defaultBanner:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1920&q=80' },
  ligue1:{ name:'Ligue 1', flag:'🇫🇷', accent:'#091c3e', defaultBanner:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1920&q=80' }
};

const AVATAR_COLORS = ['#e94560','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'];

function generateDemoPredictions() {
  const preds = {};
  ALL_MATCHES.slice(0,60).forEach(m => {
    if (Math.random()>0.3) preds[m.id] = {h:Math.floor(Math.random()*4), a:Math.floor(Math.random()*3)};
  });
  return preds;
}

let appState = {
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [
    { id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{}, bonuses:{}, groups:[], avatar:null },
    { id:'u1', username:'Alex_PL', email:'alex@test.com', pass:'123456', role:'user', points:45, preds:generateDemoPredictions(), bonuses:{}, groups:[], avatar:null },
    { id:'u2', username:'Sophie_L1', email:'sophie@test.com', pass:'123456', role:'user', points:38, preds:generateDemoPredictions(), bonuses:{}, groups:[], avatar:null },
    { id:'u3', username:'Marco_SerieA', email:'marco@test.com', pass:'123456', role:'user', points:31, preds:generateDemoPredictions(), bonuses:{}, groups:[], avatar:null }
  ],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [
    {
      id: 'grp_demo',
      name: '⚽ Ligue des Amis VIP 2026-27',
      code: 'FOOT26',
      createdBy: 'admin',
      creatorName: 'Admin',
      members: ['admin', 'u1', 'u2', 'u3'],
      createdAt: new Date().toISOString()
    }
  ],
  globalChat: JSON.parse(localStorage.getItem('pf_global_chat')) || [],
  pollVotes: { real: 45, psg: 30, mancity: 25 },
  settings: {
    announce: 'Bienvenue sur la saison 2026-27 de PronoFoot ! ⚽',
    bgImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
    leagueBanners: {},
    leagueBackgrounds: {},
    themeColor: '#e94560',
    apiKey: REAL_API_KEY
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';

function getTeamCrest(name) {
  return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16213e&color=fff&size=64&bold=true`;
}

function compressAndReadFile(file, maxWidth, quality, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(dataUrl);
    };
    img.onerror = function() { alert("Erreur lors de la lecture du fichier image."); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function uploadUserAvatar(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;

  compressAndReadFile(file, 180, 0.6, async function(dataUrl) {
    currentUser.avatar = dataUrl;
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].avatar = dataUrl;
    
    try {
      localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
      localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    } catch(e) {}

    if (firestore) {
      try {
        await firestore.collection('users').doc(currentUser.id).update({ avatar: dataUrl });
      } catch (err) {}
    }

    updateUI();
    renderLeaderboard();
    renderDashboardLeaderboard();
    alert('📸 Photo de profil mise à jour avec succès !');
  });
}

function shareChallengeWhatsApp() {
  if (!currentUser) return;
  const sorted = getSorted();
  const rank = sorted.findIndex(u => u.id === currentUser.id) + 1;
  const url = window.location.href;

  const msg = `🏆 *PRONOFOOT 2026-27*\n\n👤 Joueur : *${currentUser.username}*\n⭐ Points : *${currentUser.points} pts*\n🥇 Rang : *#${rank > 0 ? rank : 1}*\n\n🔥 *Penses-tu pouvoir me battre ?* Rejoins-moi et fais tes pronostics en direct ici :\n👉 ${url}`;
  
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

function listenCloudData() {
  if (!firestore) return;

  try {
    firestore.collection('global_chat').orderBy('timestamp', 'asc').limitToLast(50).onSnapshot(snap => {
      const msgs = [];
      snap.forEach(d => msgs.push(d.data()));
      if (msgs.length > 0) {
        appState.globalChat = msgs;
        renderGlobalChat();
      }
    });

    firestore.collection('users').onSnapshot(snap => {
      const cloudUsers = [];
      snap.forEach(d => cloudUsers.push({ id: d.id, ...d.data() }));
      if (cloudUsers.length > 0) appState.users = cloudUsers;
      if (currentUser) {
        const u = appState.users.find(x => x.id === currentUser.id);
        if (u) currentUser = u;
      }
      recalculateAllCloudPoints();
      updateUI();
      renderMatches();
      renderLeaderboard();
      renderDashboardLeaderboard();
      renderGroups();
      renderKingOfWeek();
    });

    firestore.collection('settings').doc('global').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        appState.scores = data.scores || {};
        appState.settings = { ...appState.settings, ...data };
        applyTheme();
        if (appState.settings.announce) {
          document.getElementById('announcementBox').style.display = 'block';
          document.getElementById('announcementText').textContent = appState.settings.announce;
        }
        recalculateAllCloudPoints();
        updateUI();
        renderMatches();
        renderLeaderboard();
        renderDashboardLeaderboard();
        if (currentUser && currentUser.role === 'admin') {
          renderAdminMatchList();
          renderAdminStats();
        }
      }
    });

    firestore.collection('groups').onSnapshot(snap => {
      const cloudGroups = [];
      snap.forEach(d => cloudGroups.push({ id: d.id, ...d.data() }));
      if (cloudGroups.length > 0) {
        appState.groups = cloudGroups;
        localStorage.setItem('pf_groups_v3', JSON.stringify(appState.groups));
      }
      renderGroups();
    });
  } catch (err) {}
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
    for (const [id, p] of Object.entries(u.preds || {})) {
      const s = appState.scores[id];
      if (s) t += calcPts(p, s);
    }
    u.points = t;
  });
}

function getUserStats(u) {
  let ex=0, co=0, wr=0, pe=0;
  for (const [id, p] of Object.entries(u.preds || {})) {
    const s = appState.scores[id];
    if (!s) { pe++; continue; }
    const pts = calcPts(p, s);
    if (pts===5) ex++; else if (pts===3) co++; else wr++;
  }
  return { exact:ex, correct:co, wrong:wr, pending:pe, total:Object.keys(u.preds||{}).length };
}

function getSorted() { return [...appState.users].sort((a,b) => b.points - a.points); }
function getAvatarColor(u) { return AVATAR_COLORS[(u || 'A').charCodeAt(0) % AVATAR_COLORS.length]; }

function applyTheme() {
  let currentBg = appState.settings.bgImage;
  let activeAccent = appState.settings.themeColor;

  if (currentLeague !== 'all' && LEAGUE_INFO[currentLeague]) {
    const li = LEAGUE_INFO[currentLeague];
    currentBg = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[currentLeague]) || li.defaultBg;
    activeAccent = li.accent;
  }

  document.documentElement.style.setProperty('--accent', activeAccent);
  if (currentBg) {
    document.documentElement.style.setProperty('--bg-image', `url('${currentBg}')`);
  }
}

function init() {
  recalculateAllCloudPoints();
  listenCloudData();

  if (currentUser) {
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
  }
}

function setupApp() {
  applyTheme();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  renderKingOfWeek();
  renderBonuses();
  renderGroups();
  renderGlobalChat();
  
  // N'afficher l'Admin QUE si currentUser a role === 'admin'
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
    renderAdminStats();
  } else {
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('topAdminBtn').style.display = 'none';
  }
}

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

async function handleLogin(e) {
  e.preventDefault();
  const emailOrUser = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.innerText = "⏳ Connexion...";
  btn.disabled = true;

  const localFound = appState.users.find(x => 
    (x.email.toLowerCase() === emailOrUser.toLowerCase() || x.username.toLowerCase() === emailOrUser.toLowerCase()) && x.pass === pass
  );

  if (localFound) {
    currentUser = localFound;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
    btn.innerText = "Se connecter →";
    btn.disabled = false;
    return;
  }

  if (firestore) {
    try {
      const query = await firestore.collection('users').where('email', '==', emailOrUser).where('pass', '==', pass).get();
      if (!query.empty) {
        const userDoc = query.docs[0];
        currentUser = { id: userDoc.id, ...userDoc.data() };
        localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
        document.getElementById('authScreen').style.display = 'none';
        setupApp();
        btn.innerText = "Se connecter →";
        btn.disabled = false;
        return;
      }
    } catch (err) {}
  }

  document.getElementById('authError').textContent = 'Email ou mot de passe incorrect.';
  document.getElementById('authError').style.display = 'block';
  btn.innerText = "Se connecter →";
  btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');

  btn.innerText = "⏳ Création...";
  btn.disabled = true;

  // Rôle STRICT 'user' pour toutes les inscriptions publiques
  const newUser = {
    id: 'u_' + Date.now(),
    username,
    email,
    pass,
    role: 'user',
    points: 0,
    preds: {},
    bonuses: {},
    groups: [],
    avatar: null,
    createdAt: new Date().toISOString()
  };

  if (firestore) {
    try {
      const ref = await firestore.collection('users').add(newUser);
      newUser.id = ref.id;
    } catch (e) {}
  }

  appState.users.push(newUser);
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  currentUser = newUser;
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));

  document.getElementById('authScreen').style.display = 'none';
  setupApp();
  btn.innerText = "Créer mon compte →";
  btn.disabled = false;
  alert(`🎉 Bienvenue ${username} !`);
}

function handleLogout() {
  localStorage.removeItem('pf_cloud_session');
  currentUser = null;
  location.reload();
}

function getAvatarHtml(u, sizePx = 32, fontSize = 0.8) {
  if (u && u.avatar) {
    return `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;background-image:url('${u.avatar}');background-size:cover;background-position:center;border:1px solid var(--border);flex-shrink:0"></div>`;
  }
  const name = (u && u.username) ? u.username : 'A';
  const color = getAvatarColor(name);
  return `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${fontSize}rem;flex-shrink:0;color:white;border:1px solid var(--border)">${name[0].toUpperCase()}</div>`;
}

function updateUI() {
  if (!currentUser) return;
  document.getElementById('navPoints').textContent = '⭐ ' + currentUser.points + ' pts';
  
  if (currentUser.avatar) {
    document.getElementById('navAvatar').innerHTML = '';
    document.getElementById('navAvatar').style.backgroundImage = `url('${currentUser.avatar}')`;
    document.getElementById('navAvatar').style.backgroundSize = 'cover';
    
    document.getElementById('profileBigAvatar').innerHTML = '';
    document.getElementById('profileBigAvatar').style.backgroundImage = `url('${currentUser.avatar}')`;
    document.getElementById('profileBigAvatar').style.backgroundSize = 'cover';
  } else {
    document.getElementById('navAvatar').textContent = (currentUser.username || 'A')[0].toUpperCase();
    document.getElementById('navAvatar').style.background = getAvatarColor(currentUser.username);
    
    document.getElementById('profileBigAvatar').textContent = (currentUser.username || 'A')[0].toUpperCase();
    document.getElementById('profileBigAvatar').style.background = getAvatarColor(currentUser.username);
  }

  document.getElementById('welcomeMsg').textContent = 'Bienvenue, ' + currentUser.username + ' ! 👋';

  const st = getUserStats(currentUser);
  document.getElementById('statPoints').textContent = currentUser.points;
  document.getElementById('statPredictions').textContent = st.total;
  document.getElementById('statExact').textContent = st.exact;

  const sorted = getSorted();
  const rank = sorted.findIndex(u => u.id === currentUser.id);
  document.getElementById('statRank').textContent = rank >= 0 ? '#' + (rank+1) : '-';

  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent = currentUser.role === 'admin' ? '⭐ Administrateur' : '🎮 Joueur';
}

function renderKingOfWeek() {
  const sorted = getSorted();
  const king = sorted[0];
  if (!king) return;

  document.getElementById('kingUsername').textContent = king.username + (king.role==='admin'?' ⭐':'');
  document.getElementById('kingPoints').textContent = king.points + ' points au classement';
}

function renderDashboardLeaderboard() {
  const sorted = getSorted();
  const max = sorted[0]?.points || 1;
  let html = '';

  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    const avatarHtml = getAvatarHtml(u, 36, 1);

    html += `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${isMe?'rgba(233,69,96,0.15)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px">
        <span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span>
        ${avatarHtml}
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.9rem">${u.username} ${u.role==='admin'?'⭐':''}</div>
          <div style="height:4px;background:var(--bg-dark);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div>
        </div>
        <span style="font-weight:800;color:var(--gold);min-width:55px;text-align:right">${u.points} pts</span>
      </div>`;
  });
  document.getElementById('dashboardLeaderboard').innerHTML = html;
}

function renderLeaderboard() {
  const sorted = getSorted();
  let pod = '';

  if (sorted.length >= 3) {
    const p = [sorted[1], sorted[0], sorted[2]];
    const h = [100, 140, 75];
    const m = ['🥈','🥇','🥉'];
    const bg = ['var(--silver)','var(--gold)','var(--bronze)'];

    pod = '<div style="display:flex;justify-content:center;align-items:flex-end;gap:10px;margin-bottom:20px">';
    p.forEach((u, i) => {
      if (!u) return;
      const avatarHtml = getAvatarHtml(u, 45, 1.2);
      pod += `
        <div style="text-align:center;flex:1;max-width:120px">
          <div style="font-size:1.5rem">${m[i]}</div>
          <div style="margin:5px auto;display:flex;justify-content:center">${avatarHtml}</div>
          <div style="font-weight:700;font-size:0.85rem">${u.username}</div>
          <div style="font-weight:800;color:var(--gold)">${u.points} pts</div>
          <div style="height:${h[i]}px;background:linear-gradient(to top,${bg[i]},transparent);border-radius:8px 8px 0 0;margin-top:8px;opacity:0.35"></div>
        </div>`;
    });
    pod += '</div>';
  }
  document.getElementById('podiumContainer').innerHTML = pod;

  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅ Exact</th><th>🎯 Bon</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const st = getUserStats(u);
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const avatarHtml = getAvatarHtml(u, 30, 0.8);

    html += `
      <tr class="${isMe?'current-user':''}">
        <td>${medal}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${avatarHtml}
            ${u.username} ${u.role==='admin'?'⭐':''} ${isMe?'<span style="color:var(--accent);font-size:0.7rem">(toi)</span>':''}
          </div>
        </td>
        <td>${st.total}</td>
        <td style="color:var(--gold);font-weight:bold">${st.exact}</td>
        <td style="color:var(--green);font-weight:bold">${st.correct}</td>
        <td style="font-size:1.1rem;font-weight:800">${u.points} pts</td>
      </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

// TOGGLE ET AFFICHAGE DES PRONOSTICS DE TOUS LES AUTRES JOUEURS POUR UN MATCH
function toggleMatchPredictions(matchId) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;

  if (el.style.display === 'none') {
    const match = ALL_MATCHES.find(m => m.id === matchId);
    const score = appState.scores[matchId];
    
    // Lister tous les joueurs qui ont pronostiqué ce match
    let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Pronostics des joueurs :</div>';
    let userPredCount = 0;

    appState.users.forEach(u => {
      const pred = u.preds && u.preds[matchId];
      if (pred && pred.h !== '' && pred.a !== '') {
        userPredCount++;
        let resultLabel = '';
        if (score) {
          const pts = calcPts(pred, score);
          const ptsClass = pts === 5 ? 'pts-exact' : pts === 3 ? 'pts-correct' : 'pts-wrong';
          resultLabel = `<span class="${ptsClass}" style="margin-left:auto;font-weight:bold">(+${pts} pts)</span>`;
        }
        
        const avatarHtml = getAvatarHtml(u, 22, 0.6);
        html += `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem">
            ${avatarHtml}
            <span style="flex:1"><strong>${u.username}</strong></span>
            <span style="background:var(--bg-dark);padding:2px 8px;border-radius:4px;font-weight:bold">${pred.h} - ${pred.a}</span>
            ${resultLabel}
          </div>`;
      }
    });

    if (userPredCount === 0) {
      html += '<p style="color:var(--text-muted);font-size:0.8rem">Aucun joueur n\'a encore pronostiqué ce match.</p>';
    }

    el.innerHTML = html;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;

  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  if (currentMonth !== 'all') {
    list = list.filter(m => {
      const parts = m.date.split('/');
      return parts.length === 3 && parts[1] === currentMonth;
    });
  }

  const bannerArea = document.getElementById('leagueBannerArea');
  if (currentLeague !== 'all' && LEAGUE_INFO[currentLeague]) {
    const li = LEAGUE_INFO[currentLeague];
    const bannerImg = (appState.settings.leagueBanners && appState.settings.leagueBanners[currentLeague]) || li.defaultBanner;
    bannerArea.innerHTML = `<div class="league-banner" style="background-image:url('${bannerImg}')"><h2>${li.flag} ${li.name}</h2><p>Saison Officielle 2026-27</p></div>`;
  } else {
    bannerArea.innerHTML = '';
  }

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">Aucun match trouvé pour ce filtre.</p>';
    return;
  }

  let html = '';
  list.forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h:'', a:'' };
    const score = appState.scores[m.id];
    const done = !!score;
    const li = LEAGUE_INFO[m.league] || { name:m.league, flag:'⚽' };
    const homeCrest = getTeamCrest(m.home);
    const awayCrest = getTeamCrest(m.away);

    // Compter combien d'utilisateurs ont pronostiqué ce match
    let totalPredsForMatch = 0;
    appState.users.forEach(u => {
      if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPredsForMatch++;
    });

    let res = '';
    if (done) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Score Exact (+5 pts)':pts===3?'✅ Bon Vainqueur (+3 pts)':'❌ Incorrect (0 pt)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header">
          <span>${li.flag} <strong>${li.name}</strong></span>
          <span style="color:var(--gold)">📅 ${m.date}</span>
        </div>
        <div class="match-teams">
          <div class="match-team home">
            <span>${m.home}</span>
            <img src="${homeCrest}" class="team-crest" alt="${m.home}">
          </div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away">
            <img src="${awayCrest}" class="team-crest" alt="${m.away}">
            <span>${m.away}</span>
          </div>
        </div>
        ${!done ? `
        <div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="-">
          <span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="-">
        </div>` : ''}
        ${res}

        <!-- BOUTON VOIR LES PRONOSTICS DES AUTRES JOUEURS -->
        <div style="text-align:center;margin-top:12px;border-top:1px solid var(--border);padding-top:8px">
          <button class="btn btn-secondary btn-xs" onclick="toggleMatchPredictions('${m.id}')">
            👥 Voir les pronos des autres (${totalPredsForMatch} joueur${totalPredsForMatch>1?'s':''})
          </button>
        </div>

        <!-- CONTENEUR DES PRONOS DES AUTRES (CACHÉ PAR DÉFAUT) -->
        <div id="all_preds_${m.id}" style="display:none;margin-top:10px;padding:10px;background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)"></div>
      </div>`;
  });
  container.innerHTML = html;
}

// NAVIGATION SÉCURISÉE STRICTEMENT DÉFENDUE
function navigateTo(p) {
  // BLOQUER L'ACCÈS À L'ADMIN SI LE JOUEUR N'EST PAS ADMIN
  if (p === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("⛔ Accès refusé ! Cette section est strictement réservée à l'administrateur du site.");
      return;
    }
  }

  if (p !== 'matches') {
    currentLeague = 'all';
    applyTheme();
  }

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  if (p === 'admin') { renderAdminMatchList(); renderAdminStats(); }
  if (p === 'leaderboard') renderLeaderboard();
  if (p === 'groups') renderGroups();
  if (p === 'chat') renderGlobalChat();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onload = init;
