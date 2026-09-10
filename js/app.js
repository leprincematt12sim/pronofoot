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

const LEAGUE_INFO = {
  champions:{ name:'Ligue des Champions', flag:'🏆', accent:'#f5c518', defaultBanner:'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1920&q=80' },
  premier:{ name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent:'#3d195b', defaultBanner:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1920&q=80' },
  laliga:{ name:'La Liga', flag:'🇪🇸', accent:'#ee8707', defaultBanner:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80' },
  seriea:{ name:'Serie A', flag:'🇮🇹', accent:'#024494', defaultBanner:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1920&q=80' },
  bundesliga:{ name:'Bundesliga', flag:'🇩🇪', accent:'#d20515', defaultBanner:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1920&q=80' },
  ligue1:{ name:'Ligue 1', flag:'🇫🇷', accent:'#091c3e', defaultBanner:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80', defaultBg:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1920&q=80' }
};

const AVATAR_COLORS = ['#e94560','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'];

let appState = {
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [],
  globalChat: JSON.parse(localStorage.getItem('pf_global_chat')) || [],
  settings: {
    bgImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
    authBgImage: '',
    dashboardBgImage: '',
    themeColor: '#00E676',
    apiKey: REAL_API_KEY,
    playlist: JSON.parse(localStorage.getItem('pf_playlist')) || [
      { name: "Ambiance Stade", src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" }
    ]
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }

// COMPRESSION PHOTO AVATAR ULTRA-OPTICIONNÉE (~10 KB)
function compressAndReadFile(file, maxWidth, quality, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width, height = img.height;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// UPLOAD D'AVATAR ULTRA-RAPIDE
async function uploadUserAvatar(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;

  compressAndReadFile(file, 120, 0.5, async function(dataUrl) {
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
      } catch (err) {
        console.warn("Update avatar cloud:", err.message);
      }
    }

    updateUI();
    renderLeaderboard();
    renderDashboardLeaderboard();
    alert('📸 Photo de profil mise à jour avec succès !');
  });
}

// UPLOAD IMAGES ADMIN
function uploadAuthBgFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressAndReadFile(file, 1200, 0.6, async function(dataUrl) {
    appState.settings.authBgImage = dataUrl;
    applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ authBgImage: dataUrl }, { merge: true }); } catch (err) {} }
    alert('📸 Fond de connexion mis à jour !');
  });
}

function uploadDashboardBgFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressAndReadFile(file, 1200, 0.6, async function(dataUrl) {
    appState.settings.dashboardBgImage = dataUrl;
    applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ dashboardBgImage: dataUrl }, { merge: true }); } catch (err) {} }
    alert('📸 Fond de l\'accueil mis à jour !');
  });
}

// AUDIO PLAYER
let audioPlayer = null, currentSongIndex = 0, isMusicPlaying = false;
function setupAudioPlayer() {
  audioPlayer = document.getElementById('siteAudioPlayer');
  if (!audioPlayer) return;
  audioPlayer.onended = () => { nextSong(); };
  renderPlaylistUI();
  loadSong(currentSongIndex);
}
function loadSong(index) {
  if (!appState.settings.playlist || appState.settings.playlist.length === 0) return;
  if (index < 0) index = appState.settings.playlist.length - 1;
  if (index >= appState.settings.playlist.length) index = 0;
  currentSongIndex = index;
  audioPlayer.src = appState.settings.playlist[index].src;
  document.getElementById('musicTitleDisplay').textContent = appState.settings.playlist[index].name;
  if (isMusicPlaying) audioPlayer.play();
}
function toggleSiteMusic() {
  if (!appState.settings.playlist || appState.settings.playlist.length === 0) return;
  const icon = document.getElementById('musicStatusIcon');
  if (isMusicPlaying) { audioPlayer.pause(); isMusicPlaying = false; icon.textContent = "🎵"; }
  else { audioPlayer.play().then(() => { isMusicPlaying = true; icon.textContent = "🔊"; }).catch(()=>{}); }
}
function nextSong() { loadSong(currentSongIndex + 1); }
function prevSong() { loadSong(currentSongIndex - 1); }
function renderPlaylistUI() {
  const container = document.getElementById('playlistContainer');
  if (!container || !appState.settings.playlist) return;
  container.innerHTML = appState.settings.playlist.map((song, i) => `<div class="playlist-item" onclick="loadSong(${i});if(!isMusicPlaying)toggleSiteMusic();">🎵 ${song.name}</div>`).join('');
}

// SYNCHRO API SPORTS
async function saveAndSyncApiSports() {
  const apiKey = document.getElementById('adminApiKeyInput')?.value.trim() || appState.settings.apiKey || REAL_API_KEY;
  const btn = document.getElementById('btnSyncApi');
  if(btn) { btn.innerHTML = "⏳ Recherche en cours..."; btn.disabled = true; }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayStr}`, {
      method: "GET",
      headers: { "x-apisports-key": apiKey }
    });

    const data = await res.json();
    const fixtures = data.response || [];
    let count = 0;

    fixtures.forEach(f => {
      if (['FT', 'AET', 'PEN'].includes(f.fixture.status.short)) {
        const hName = f.teams.home.name.toLowerCase();
        const aName = f.teams.away.name.toLowerCase();
        const match = ALL_MATCHES.find(m => m.home.toLowerCase().includes(hName) || m.away.toLowerCase().includes(aName));
        if (match) { appState.scores[match.id] = { h: f.goals.home, a: f.goals.away }; count++; }
      }
    });

    localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
    if (firestore) { await firestore.collection('settings').doc('global').set({ scores: appState.scores, apiKey: apiKey }, { merge: true }); }
    recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
    
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert(`✅ Merveilleux ! ${count} score(s) réel(s) synchronisé(s) !`);
  } catch (err) {
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert("❌ Erreur API : " + err.message);
  }
}

// FIREBASE CLOUD REAL-TIME SYNC
function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  const authScreen = document.getElementById('authScreen');
  if (authScreen) {
    if (appState.settings.authBgImage) {
      authScreen.style.backgroundImage = `url('${appState.settings.authBgImage}')`;
      authScreen.style.backgroundSize = 'cover';
    } else {
      authScreen.style.background = 'radial-gradient(circle at top, #16213e, #0a0a1a)';
    }
  }

  let bg = appState.settings.bgImage;
  if (currentLeague === 'dashboard' && appState.settings.dashboardBgImage) {
    bg = appState.settings.dashboardBgImage;
  } else if (currentLeague !== 'all' && currentLeague !== 'dashboard' && LEAGUE_INFO[currentLeague]) {
    bg = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[currentLeague]) || LEAGUE_INFO[currentLeague].defaultBg;
  }
  document.documentElement.style.setProperty('--bg-image', `url('${bg}')`);
}

function listenCloudData() {
  if (!firestore) return;
  try {
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
        setupAudioPlayer(); applyTheme(); recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
        if (currentUser && currentUser.role === 'admin') renderAdminMatchList();
      }
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
    for (const [id, p] of Object.entries(u.preds || {})) { const s = appState.scores[id]; if (s) t += calcPts(p, s); }
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
function getAvatarColor(u) { return AVATAR_COLORS[(u||'A').charCodeAt(0)%AVATAR_COLORS.length]; }

function init() {
  if (appState.users.length === 0) {
    appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  }

  recalculateAllCloudPoints();
  listenCloudData();
  setupAudioPlayer();
  setupMonthFilter();

  if (currentUser) {
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
    applyTheme();
  }
}

function setupApp() {
  applyTheme();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
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
  const userOrEmail = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.innerText = "⏳ Connexion..."; btn.disabled = true;

  if (firestore && appState.users.length <= 1) {
    try {
      const snap = await firestore.collection('users').get();
      if (!snap.empty) { appState.users = snap.docs.map(d => ({id: d.id, ...d.data()})); }
    } catch(err) {}
  }

  const found = appState.users.find(u => (u.email.toLowerCase() === userOrEmail || u.username.toLowerCase() === userOrEmail) && u.pass === pass);

  if (found) {
    currentUser = found;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none';
    setupApp(); btn.innerText = "Se connecter →"; btn.disabled = false; return;
  }

  document.getElementById('authError').textContent = 'Identifiant ou mot de passe incorrect.';
  document.getElementById('authError').style.display = 'block';
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
    document.getElementById('authError').textContent = 'Pseudo déjà utilisé.';
    document.getElementById('authError').style.display = 'block';
    btn.innerText = "Créer mon compte →"; btn.disabled = false; return;
  }

  const newUser = { id: 'u_' + Date.now(), username, email, pass, role: 'user', points: 0, preds: {}, createdAt: new Date().toISOString() };
  if (firestore) { try { const ref = await firestore.collection('users').add(newUser); newUser.id = ref.id; } catch (e) {} }
  appState.users.push(newUser);
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  currentUser = newUser;
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none';
  setupApp(); btn.innerText = "Créer mon compte →"; btn.disabled = false;
}

function handleLogout() { localStorage.removeItem('pf_cloud_session'); currentUser = null; location.reload(); }
function togglePassword(inputId) { const input = document.getElementById(inputId); input.type = input.type === "password" ? "text" : "password"; }

function setupMonthFilter() {
  const d = new Date();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  currentMonth = m;
  const bar = document.getElementById('monthFilterBar');
  if (!bar) return;
  const months = [{val:'all', lbl:'Toute l\'année'}, {val:'08',lbl:'Août'}, {val:'09',lbl:'Septembre'}, {val:'10',lbl:'Octobre'}, {val:'11',lbl:'Novembre'}, {val:'12',lbl:'Décembre'}, {val:'01',lbl:'Janvier'}, {val:'02',lbl:'Février'}, {val:'03',lbl:'Mars'}, {val:'04',lbl:'Avril'}, {val:'05',lbl:'Mai'}];
  let html = ''; months.forEach(mo => { const isAct = mo.val === currentMonth; html += `<button class="matchday-pill ${isAct?'active':''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`; });
  bar.innerHTML = html;
}

function filterByMonth(m) { currentMonth = m; document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }
function filterLeague(l) { currentLeague = l; applyTheme(); document.querySelectorAll('#page-matches .league-tab').forEach(t => t.classList.remove('active')); if (event && event.target) event.target.classList.add('active'); renderMatches(); }

function navigateTo(p) {
  if (p === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') { alert("⛔ Accès refusé ! Réservé à l'administrateur."); return; }
  }
  if (p === 'dashboard') { currentLeague = 'dashboard'; applyTheme(); } else { currentLeague = 'all'; applyTheme(); }
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');
  if (p === 'admin') { renderAdminMatchList(); renderAdminPlaylist(); }
  if (p === 'leaderboard') renderLeaderboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// MISE À JOUR DE L'INTERFACE UTILISATEUR & PROFIL (SOLDE ET RANG)
function getAvatarHtml(u, sizePx = 32, fontSize = 0.8) {
  if (u && u.avatar) return `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;background-image:url('${u.avatar}');background-size:cover;background-position:center;border:1px solid var(--border);flex-shrink:0"></div>`;
  const name = (u && u.username) ? u.username : 'A';
  return `<div style="width:${sizePx}px;height:${sizePx}px;border-radius:50%;background:${getAvatarColor(name)};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${fontSize}rem;flex-shrink:0;color:white;border:1px solid var(--border)">${name[0].toUpperCase()}</div>`;
}

function updateUI() {
  if (!currentUser) return;

  // Header Nav
  const pointsStr = (currentUser.points || 0) + ' pts';
  document.getElementById('navPoints').textContent = pointsStr;
  
  const navAv = document.getElementById('navAvatar');
  if (currentUser.avatar) {
    navAv.textContent = '';
    navAv.style.backgroundImage = `url('${currentUser.avatar}')`;
    navAv.style.backgroundSize = 'cover';
  } else {
    navAv.style.backgroundImage = 'none';
    navAv.textContent = (currentUser.username || 'A')[0].toUpperCase();
    navAv.style.background = getAvatarColor(currentUser.username);
  }

  // Dashboard Stats
  document.getElementById('welcomeMsg').textContent = 'Bienvenue, ' + currentUser.username + ' ! 👋';
  const st = getUserStats(currentUser);
  document.getElementById('statPoints').textContent = currentUser.points || 0;
  document.getElementById('statPredictions').textContent = st.total;
  document.getElementById('statExact').textContent = st.exact;

  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  const rankStr = rankIdx >= 0 ? '#' + (rankIdx + 1) : '#1';
  document.getElementById('statRank').textContent = rankStr;

  // Profil
  document.getElementById('profileUsername').textContent = currentUser.username || '-';
  document.getElementById('profileEmail').textContent = currentUser.email || '-';
  document.getElementById('profileRole').textContent = currentUser.role === 'admin' ? '⭐ Administrateur' : '🎮 Joueur';
  document.getElementById('profilePoints').textContent = currentUser.points || 0;
  document.getElementById('profileRank').textContent = rankStr;

  const profAv = document.getElementById('profileBigAvatar');
  if (profAv) {
    if (currentUser.avatar) {
      profAv.textContent = '';
      profAv.style.backgroundImage = `url('${currentUser.avatar}')`;
      profAv.style.backgroundSize = 'cover';
    } else {
      profAv.style.backgroundImage = 'none';
      profAv.textContent = (currentUser.username || 'A')[0].toUpperCase();
      profAv.style.background = getAvatarColor(currentUser.username);
    }
  }

  if (sorted[0]) {
    document.getElementById('kingUsername').textContent = sorted[0].username;
    document.getElementById('kingPoints').textContent = sorted[0].points + ' pts';
  }
}

function renderDashboardLeaderboard() {
  const sorted = getSorted();
  const max = sorted[0]?.points || 1;
  let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'rgba(0,230,118,0.1)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px"><span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span>${getAvatarHtml(u,32,0.8)}<div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${u.username} ${u.role==='admin'?'⭐':''}</div><div style="height:4px;background:var(--bg-body);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div></div><span style="font-weight:800;color:var(--gold)">${u.points} pts</span></div>`;
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
    html += `<tr class="${isMe?'current-user':''}"><td>${medal}</td><td><div style="display:flex;align-items:center;gap:8px">${getAvatarHtml(u, 26, 0.7)}<strong>${u.username}</strong> ${u.role==='admin'?'⭐':''}</div></td><td>${st.total}</td><td style="color:var(--gold);font-weight:bold">${st.exact}</td><td style="color:var(--green);font-weight:bold">${st.correct}</td><td style="font-size:1.1rem;font-weight:800">${u.points} pts</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

function toggleMatchPredictions(matchId) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;
  if (el.style.display === 'none') {
    const score = appState.scores[matchId];
    let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Pronostics des joueurs :</div>';
    let count = 0;
    appState.users.forEach(u => {
      const pred = u.preds && u.preds[matchId];
      if (pred && pred.h !== '' && pred.a !== '') {
        count++;
        let resLbl = '';
        if (score) { const pts = calcPts(pred, score); resLbl = `<span class="${pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong'}" style="margin-left:auto;font-weight:bold">(+${pts} pts)</span>`; }
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem">${getAvatarHtml(u,20,0.6)}<span style="flex:1"><strong>${u.username}</strong></span><span style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold">${pred.h} - ${pred.a}</span>${resLbl}</div>`;
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
    const li = LEAGUE_INFO[m.league] || { name:m.league, flag:'⚽' };
    const homeCrest = getTeamCrest(m.home);
    const awayCrest = getTeamCrest(m.away);
    let totalPredsForMatch = 0; appState.users.forEach(u => { if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPredsForMatch++; });

    let res = '';
    if (done) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Score Exact (+5 pts)':pts===3?'✅ Bon Vainqueur (+3 pts)':'❌ Incorrect (0 pt)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><span style="color:var(--gold)">📅 ${m.date}</span></div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${homeCrest}" class="team-crest"></div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${awayCrest}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${!done ? `<div class="match-prediction"><input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="-"><span>:</span><input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="-"></div>` : ''}
        ${res}
        <div style="text-align:center;margin-top:12px;border-top:1px solid var(--border);padding-top:8px">
          <button class="btn btn-secondary btn-xs" onclick="toggleMatchPredictions('${m.id}')">👥 Voir les pronos des autres (${totalPredsForMatch})</button>
        </div>
        <div id="all_preds_${m.id}" style="display:none;margin-top:10px;padding:10px;background:var(--bg-body);border-radius:8px;border:1px solid var(--border)"></div>
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

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;
  localStorage.setItem('pf_local_users', JSON.stringify(appState.users));
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  if (firestore) { try { await firestore.collection('users').doc(currentUser.id).update({ preds: currentUser.preds }); } catch (err) {} }

  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  alert(`${count} pronostics enregistrés ! ☁️✅`);
}

function renderAdminMatchList() {
  let html = '';
  ALL_MATCHES.slice(0, 50).forEach(m => {
    const s = appState.scores[m.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span><span style="flex:1;font-size:0.85rem;min-width:140px">${m.home} vs ${m.away}</span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button><span style="font-size:0.75rem;font-weight:bold;color:${s?'var(--green)':'var(--text-dim)'}">${s?'✅':'⏳'}</span></div>`;
  });
  document.getElementById('adminMatchList').innerHTML = html;
}

async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a };
  localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
  if (firestore) { try { await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true }); } catch (e) {} }
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert('Score enregistré et points recalculés ! ⚡');
}

window.onload = init;
