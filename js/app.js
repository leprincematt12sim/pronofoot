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
  globalChat: JSON.parse(localStorage.getItem('pf_global_chat')) || [
    { senderName: "Alex_PL", text: "Salut à tous les supporters ! Prêts pour la saison ?", time: "12:00" },
    { senderName: "Sophie_L1", text: "Allez Paris SG cette saison !", time: "12:05" }
  ],
  pollVotes: { real: 45, psg: 30, mancity: 25 },
  settings: {
    announce: 'Bienvenue sur la saison 2026-27 de PronoFoot ! ⚽',
    bgImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
    leagueBanners: {},
    leagueBackgrounds: {},
    themeColor: '#e94560'
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';
let activeGroup = null;
let activeGroupChatUnsubscribe = null;

function getTeamCrest(name) {
  return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16213e&color=fff&size=64&bold=true`;
}

function compressAndReadFile(file, maxWidth, callback) {
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function uploadUserAvatar(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;

  compressAndReadFile(file, 200, async function(dataUrl) {
    currentUser.avatar = dataUrl;
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].avatar = dataUrl;
    localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    
    if (firestore) {
      try { await firestore.collection('users').doc(currentUser.id).update({ avatar: dataUrl }); } catch (err) {}
    }
    updateUI();
    renderLeaderboard();
    renderDashboardLeaderboard();
    alert('📸 Photo de profil mise à jour avec succès !');
  });
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
  renderBonuses();
  renderGroups();
  renderGlobalChat();
  
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

async function quickAdminLogin() {
  const adminUser = appState.users.find(u => u.role === 'admin') || {
    id: 'admin',
    username: 'Admin',
    email: 'admin@pronofoot.com',
    pass: 'admin123',
    role: 'admin',
    points: 0,
    preds: {},
    bonuses: {},
    groups: [],
    avatar: null
  };

  currentUser = adminUser;
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none';
  setupApp();
  navigateTo('admin');
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

function renderGlobalChat() {
  const box = document.getElementById('globalChatMessagesBox');
  if (!box) return;

  let html = '';
  appState.globalChat.forEach(m => {
    const isMine = currentUser && m.senderName === currentUser.username;
    const senderUser = appState.users.find(u => u.username === m.senderName) || { username: m.senderName };
    const avatarHtml = getAvatarHtml(senderUser, 24, 0.7);

    html += `
      <div class="chat-msg ${isMine?'mine':''}" style="display:flex;gap:8px">
        ${!isMine ? avatarHtml : ''}
        <div style="flex:1">
          <div class="sender"><span>${isMine ? 'Moi' : m.senderName}</span> <span>${m.time || ''}</span></div>
          <div>${m.text}</div>
        </div>
        ${isMine ? avatarHtml : ''}
      </div>`;
  });

  box.innerHTML = html || '<p style="text-align:center;color:var(--text-muted);font-size:0.85rem">Aucun message. Soyez le premier !</p>';
  box.scrollTop = box.scrollHeight;
}

async function handleSendGlobalChatMessage(e) {
  e.preventDefault();
  if (!currentUser) return;
  const input = document.getElementById('globalChatInput');
  const txt = input.value.trim();
  if (!txt) return;

  input.value = '';
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  const msgData = {
    senderId: currentUser.id,
    senderName: currentUser.username,
    text: txt,
    time: timeStr,
    timestamp: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : Date.now()
  };

  if (firestore) {
    try { await firestore.collection('global_chat').add(msgData); } catch (e) {}
  }

  appState.globalChat.push(msgData);
  localStorage.setItem('pf_global_chat', JSON.stringify(appState.globalChat));
  renderGlobalChat();
}

function votePoll(option) {
  if (option === 'real') appState.pollVotes.real += 5;
  if (option === 'psg') appState.pollVotes.psg += 5;
  if (option === 'mancity') appState.pollVotes.mancity += 5;

  const total = appState.pollVotes.real + appState.pollVotes.psg + appState.pollVotes.mancity;
  const pReal = Math.round((appState.pollVotes.real / total) * 100);
  const pPsg = Math.round((appState.pollVotes.psg / total) * 100);
  const pMC = Math.round((appState.pollVotes.mancity / total) * 100);

  document.getElementById('bar_real').style.width = pReal + '%';
  document.getElementById('count_real').textContent = pReal + '%';
  document.getElementById('bar_psg').style.width = pPsg + '%';
  document.getElementById('count_psg').textContent = pPsg + '%';
  document.getElementById('bar_mancity').style.width = pMC + '%';
  document.getElementById('count_mancity').textContent = pMC + '%';

  alert('A voté ! 📊');
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
      </div>`;
  });
  container.innerHTML = html;
}

// === GROUPES PRIVÉS & INVITATION WHATSAPP ===
async function showCreateGroupPrompt() {
  const name = prompt("Nom de votre Groupe Privé (ex: Les Potes du Foot) :");
  if (!name || !name.trim()) return;

  const code = 'GRP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const newGroup = {
    id: 'grp_' + Date.now(),
    name: name.trim(),
    code: code,
    createdBy: currentUser ? currentUser.id : 'admin',
    creatorName: currentUser ? currentUser.username : 'Admin',
    members: currentUser ? [currentUser.id] : ['admin'],
    createdAt: new Date().toISOString()
  };

  if (firestore) {
    try {
      const ref = await firestore.collection('groups').add(newGroup);
      newGroup.id = ref.id;
    } catch (e) {}
  }

  appState.groups.push(newGroup);
  localStorage.setItem('pf_groups_v3', JSON.stringify(appState.groups));
  renderGroups();
  
  const inviteText = `Salut ! Rejoins mon groupe "${name}" sur PronoFoot pour la saison 2026-27 !\n\n1. Va sur le site\n2. Clique sur "Groupes" > "Rejoindre avec un Code"\n3. Tape ce code : ${code}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
  
  if (confirm(`✅ Groupe "${name}" créé !\nCode d'invitation : ${code}\n\nVoulez-vous inviter vos amis sur WhatsApp ?`)) {
    window.open(whatsappUrl, '_blank');
  }
}

async function showJoinGroupPrompt() {
  const code = prompt("Entrez le code du groupe (ex: GRP-ABCD ou FOOT26) :");
  if (!code || !code.trim()) return;

  const cleanCode = code.trim().toUpperCase();
  const localGroup = appState.groups.find(g => g.code === cleanCode);

  if (localGroup) {
    if (currentUser && !localGroup.members.includes(currentUser.id)) {
      localGroup.members.push(currentUser.id);
      localStorage.setItem('pf_groups_v3', JSON.stringify(appState.groups));
    }
    renderGroups();
    alert(`🎉 Vous avez rejoint le groupe "${localGroup.name}" !`);
    return;
  }

  if (firestore) {
    try {
      const query = await firestore.collection('groups').where('code', '==', cleanCode).get();
      if (!query.empty) {
        const groupDoc = query.docs[0];
        if (currentUser) {
          await firestore.collection('groups').doc(groupDoc.id).update({
            members: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
          });
        }
        alert(`🎉 Vous avez rejoint le groupe "${groupDoc.data().name}" !`);
        return;
      }
    } catch (e) {}
  }

  alert("❌ Code invalide.");
}

function shareGroupWhatsApp(code, name) {
  const inviteText = `Salut ! Rejoins ma ligue "${name}" sur PronoFoot 2026-27 !\n\n1. Va sur le site\n2. Clique sur l'onglet "Groupes" > "Rejoindre avec un Code"\n3. Tape ce code secret : ${code}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`, '_blank');
}

function renderGroups() {
  const container = document.getElementById('groupsListContainer');
  if (!container) return;

  // Si pas de groupe créé par l'utilisateur, afficher tous les groupes auxquels il appartient (ou le groupe exemple)
  let myGroups = [];
  if (currentUser) {
    myGroups = appState.groups.filter(g => g.members && g.members.includes(currentUser.id));
  }
  
  if (myGroups.length === 0) {
    myGroups = appState.groups; // Afficher tous les groupes disponibles si aucun spécifique
  }

  if (myGroups.length === 0) {
    container.innerHTML = '<div class="rules-box"><p style="text-align:center">Aucun groupe privé. Créez-en un en cliquat sur le bouton ci-dessus !</p></div>';
    return;
  }

  let html = '';
  myGroups.forEach(g => {
    const groupUsers = appState.users.filter(u => g.members && g.members.includes(u.id)).sort((a,b) => b.points - a.points);

    html += `
      <div class="group-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div>
            <h3 style="color:var(--accent);margin-bottom:2px">${g.name}</h3>
            <span style="font-size:0.8rem;color:var(--text-muted)">Créé par ${g.creatorName} · ${groupUsers.length} membre(s)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="group-code-badge">${g.code}</span>
            <button class="btn btn-sm" style="background:#25D366;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:bold" onclick="shareGroupWhatsApp('${g.code}', '${g.name.replace(/'/g, "\\'")}')">💬 Inviter WhatsApp</button>
          </div>
        </div>

        <table class="leaderboard-table" style="font-size:0.85rem">
          <thead><tr><th>#</th><th>Membre</th><th>Pronos</th><th>Points</th></tr></thead>
          <tbody>
            ${groupUsers.map((u, i) => `
              <tr class="${currentUser && u.id===currentUser.id?'current-user':''}">
                <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    ${getAvatarHtml(u, 24, 0.6)}
                    <strong>${u.username}</strong> ${currentUser && u.id===currentUser.id?'(toi)':''}
                  </div>
                </td>
                <td>${Object.keys(u.preds||{}).length}</td>
                <td style="color:var(--gold);font-weight:bold">${u.points} pts</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  });

  container.innerHTML = html;
}

function openGroupChat(groupId, groupName) {
  activeGroup = { id: groupId, name: groupName };
  document.getElementById('groupChatSection').style.display = 'block';
  document.getElementById('chatGroupName').textContent = groupName;
  document.getElementById('groupChatSection').scrollIntoView({ behavior: 'smooth' });
}

async function handleSendChatMessage(e) {
  e.preventDefault();
  if (!activeGroup || !currentUser) return;
  const input = document.getElementById('chatInputText');
  const txt = input.value.trim();
  if (!txt) return;

  input.value = '';
  if (firestore) {
    try {
      await firestore.collection('groups').doc(activeGroup.id).collection('messages').add({
        senderId: currentUser.id,
        senderName: currentUser.username,
        text: txt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {}
  }
}

async function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;

  document.querySelectorAll('.match-prediction input').forEach(input => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_' + id)?.value;
    const a = document.getElementById('a_' + id)?.value;
    if (h !== '' && a !== '') {
      currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) };
      count++;
    }
  });

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));

  if (firestore) {
    try { await firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch (err) {}
  }

  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  alert(`${count} pronostics enregistrés ! ☁️✅`);
}

function renderBonuses() {
  const c = document.getElementById('bonusesContainer');
  const mb = (currentUser && currentUser.bonuses) || {};
  c.innerHTML = BONUS_CONFIG.map(b => {
    const sel = mb[b.id] || '';
    const opts = b.teams.map(t => `<option value="${t}" ${t===sel?'selected':''}>${t}</option>`).join('');
    return `
      <div class="admin-card">
        <h4 style="font-size:0.95rem">${b.label} <span style="color:var(--gold)">(+${b.pts} pts)</span></h4>
        <select id="bonus_${b.id}" style="width:100%;margin-top:8px;padding:8px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:6px">
          <option value="">-- Choisir le champion --</option>
          ${opts}
        </select>
      </div>`;
  }).join('');
}

async function saveBonuses() {
  if (!currentUser) return;
  if (!currentUser.bonuses) currentUser.bonuses = {};
  BONUS_CONFIG.forEach(b => {
    const v = document.getElementById('bonus_' + b.id)?.value;
    if (v) currentUser.bonuses[b.id] = v;
  });

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));

  if (firestore) {
    try { await firestore.collection('users').doc(currentUser.id).update({ bonuses: currentUser.bonuses }); } catch (e) {}
  }
  alert('Bonus sauvegardés ! 🎯');
}

function renderAdminMatchList() {
  let html = '';
  ALL_MATCHES.slice(0, 50).forEach(m => {
    const s = appState.scores[m.id];
    const li = LEAGUE_INFO[m.league] || { flag:'⚽' };
    html += `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span>
        <span>${li.flag}</span>
        <span style="flex:1;font-size:0.85rem;min-width:140px">${m.home} vs ${m.away}</span>
        <input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold">
        <span>-</span>
        <input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold">
        <button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button>
        <span style="font-size:0.75rem;font-weight:bold;color:${s?'var(--green)':'var(--text-dim)'}">${s?'✅':'⏳'}</span>
      </div>`;
  });
  document.getElementById('adminMatchList').innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a };
  localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));

  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {}
  }

  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert('Score enregistré et points recalculés ! ⚡');
}

async function adminSimulateScores() {
  let c = 0;
  ALL_MATCHES.filter(m => !appState.scores[m.id]).slice(0, 10).forEach(m => {
    appState.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3) };
    c++;
  });
  localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {}
  }
  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert(`${c} scores simulés ! 🎲`);
}

async function adminSimulateAll() {
  if (!confirm('Simuler TOUS les matchs ?')) return;
  ALL_MATCHES.forEach(m => {
    if (!appState.scores[m.id]) appState.scores[m.id] = { h: Math.floor(Math.random()*4), a: Math.floor(Math.random()*3) };
  });
  localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {}
  }
  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert('Tous les matchs ont été simulés ! 🏆');
}

async function adminResetScores() {
  if (!confirm('Supprimer tous les scores ?')) return;
  appState.scores = {};
  localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ scores: {} }, { merge: true }); } catch (e) {}
  }
  recalculateAllCloudPoints();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  renderAdminMatchList();
  renderAdminStats();
  alert('Scores réinitialisés ! 🗑️');
}

function renderAdminStats() {
  const t = ALL_MATCHES.length;
  const s = Object.keys(appState.scores).length;
  const p = appState.users.reduce((a, u) => a + Object.keys(u.preds || {}).length, 0);
  document.getElementById('adminStats').innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs 2026-27</span><strong>${t}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Scores validés</span><strong style="color:var(--green)">${s}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Joueurs inscrits</span><strong>${appState.users.length}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Pronostics totaux</span><strong style="color:var(--gold)">${p}</strong></div>`;
}

function renderAdminLeagueBackgrounds() {
  const container = document.getElementById('adminLeagueBackgrounds');
  if (!container) return;
  let html = '';
  for (const [key, li] of Object.entries(LEAGUE_INFO)) {
    const url = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[key]) || li.defaultBg;
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span>
        <label style="background:var(--accent);color:white;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:bold">
          📁 Fond PC
          <input type="file" accept="image/*" style="display:none" onchange="uploadLeagueBgFromFile(event, '${key}')">
        </label>
        <img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">
      </div>`;
  }
  container.innerHTML = html;
}

function renderAdminLeagueBanners() {
  const container = document.getElementById('adminLeagueBanners');
  if (!container) return;
  let html = '';
  for (const [key, li] of Object.entries(LEAGUE_INFO)) {
    const url = (appState.settings.leagueBanners && appState.settings.leagueBanners[key]) || li.defaultBanner;
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span>
        <label style="background:var(--accent);color:white;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:bold">
          📁 Bannière PC
          <input type="file" accept="image/*" style="display:none" onchange="uploadBannerFromFile(event, '${key}')">
        </label>
        <img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">
      </div>`;
  }
  container.innerHTML = html;
}

async function adminPublishAnnouncement() {
  const t = document.getElementById('adminAnnounceInput').value.trim();
  if (!t) return;
  appState.settings.announce = t;
  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ announce: t }, { merge: true }); } catch (e) {}
  }
  alert('Annonce publiée ! 📢');
}

async function changeTheme(c) {
  appState.settings.themeColor = c;
  if (firestore) {
    try { await firestore.collection('settings').doc('global').set({ themeColor: c }, { merge: true }); } catch (e) {}
  }
  applyTheme();
}

function filterLeague(l) {
  currentLeague = l;
  applyTheme();
  const matchesTitle = document.getElementById('matchesSectionTitle');
  if (l === 'all') matchesTitle.textContent = "⚽ Calendrier 2026-27";
  else if (LEAGUE_INFO[l]) matchesTitle.textContent = `${LEAGUE_INFO[l].flag} Calendrier ${LEAGUE_INFO[l].name}`;
  document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function filterByMonth(m) {
  currentMonth = m;
  document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function navigateTo(p) {
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
  if (p === 'admin') { renderAdminMatchList(); renderAdminStats(); renderAdminLeagueBanners(); renderAdminLeagueBackgrounds(); }
  if (p === 'leaderboard') renderLeaderboard();
  if (p === 'groups') renderGroups();
  if (p === 'chat') renderGlobalChat();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onload = init;
