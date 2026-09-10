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

const AVATAR_COLORS = ['#e94560','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'];

let appState = {
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [],
  globalChat: JSON.parse(localStorage.getItem('pf_global_chat')) || [],
  settings: {
    themeColor: '#e94560',
    playlist: JSON.parse(localStorage.getItem('pf_playlist')) || [
      { name: "Ambiance Stade", src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
      { name: "UEFA Champions Anthem", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
    ]
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;
let currentLeague = 'all';
let currentMonth = ''; 

// ============================
// LECTEUR AUDIO & PLAYLIST
// ============================
let audioPlayer = null;
let currentSongIndex = 0;
let isMusicPlaying = false;
let isShuffle = false;

function setupAudioPlayer() {
  audioPlayer = document.getElementById('siteAudioPlayer');
  if (!audioPlayer) return;

  audioPlayer.onended = () => { nextSong(); };
  renderPlaylistUI();
  loadSong(currentSongIndex);
}

function loadSong(index) {
  if (appState.settings.playlist.length === 0) return;
  if (index < 0) index = appState.settings.playlist.length - 1;
  if (index >= appState.settings.playlist.length) index = 0;
  
  currentSongIndex = index;
  const song = appState.settings.playlist[index];
  
  audioPlayer.src = song.src;
  document.getElementById('musicTitleDisplay').textContent = song.name;
  
  document.querySelectorAll('.playlist-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  if (isMusicPlaying) audioPlayer.play();
}

function toggleSiteMusic() {
  if (appState.settings.playlist.length === 0) return;
  const icon = document.getElementById('musicStatusIcon');
  const btn = document.getElementById('musicPlayBtn');

  if (isMusicPlaying) {
    audioPlayer.pause();
    isMusicPlaying = false;
    icon.textContent = "🎵";
    btn.textContent = "▶️";
  } else {
    audioPlayer.play().then(() => {
      isMusicPlaying = true;
      icon.textContent = "🔊";
      btn.textContent = "⏸";
    }).catch(() => { alert("Veuillez cliquer à nouveau pour autoriser l'audio."); });
  }
}

function nextSong() {
  if (appState.settings.playlist.length === 0) return;
  let nextIdx = isShuffle ? Math.floor(Math.random() * appState.settings.playlist.length) : (currentSongIndex + 1);
  loadSong(nextIdx);
  if (isMusicPlaying) audioPlayer.play();
}

function prevSong() {
  if (appState.settings.playlist.length === 0) return;
  let prevIdx = currentSongIndex - 1;
  loadSong(prevIdx);
  if (isMusicPlaying) audioPlayer.play();
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('musicShuffleBtn').style.color = isShuffle ? 'var(--accent)' : 'var(--text-muted)';
}

function renderPlaylistUI() {
  const container = document.getElementById('playlistContainer');
  if (!container) return;
  
  let html = '';
  appState.settings.playlist.forEach((song, i) => {
    html += `<div class="playlist-item ${i===currentSongIndex?'active':''}" onclick="loadSong(${i});if(!isMusicPlaying)toggleSiteMusic();">🎵 ${song.name}</div>`;
  });
  container.innerHTML = html;
}

// ============================
// COMPRESSION ET UPLOAD FICHIERS
// ============================
function compressAudioFile(file, callback) {
  if (file.size > 10 * 1024 * 1024) { alert("Le fichier est trop grand (limite: 10 Mo)."); return; }
  const reader = new FileReader();
  reader.onload = function(e) { callback(e.target.result, file.name); };
  reader.readAsDataURL(file);
}

function adminAddMusic(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  document.getElementById('audioFileNameDisplay').textContent = "⏳ Chargement de " + file.name + "...";
  
  compressAudioFile(file, async function(dataUrl, name) {
    const newSong = { name: name.replace('.mp3', ''), src: dataUrl };
    appState.settings.playlist.push(newSong);
    localStorage.setItem('pf_playlist', JSON.stringify(appState.settings.playlist));
    
    if (firestore) {
      try { await firestore.collection('settings').doc('global').set({ playlist: appState.settings.playlist }, { merge: true }); } catch (e) {}
    }
    
    setupAudioPlayer();
    renderAdminPlaylist();
    document.getElementById('audioFileNameDisplay').textContent = "✅ Morceau ajouté : " + newSong.name;
  });
}

function renderAdminPlaylist() {
  const cont = document.getElementById('adminPlaylistList');
  if (!cont) return;
  let html = '';
  appState.settings.playlist.forEach((s, i) => {
    html += `<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid var(--border)">
      <span>${s.name}</span>
      <button class="btn btn-xs btn-secondary" onclick="adminRemoveSong(${i})">❌</button>
    </div>`;
  });
  cont.innerHTML = html;
}

function adminRemoveSong(index) {
  appState.settings.playlist.splice(index, 1);
  localStorage.setItem('pf_playlist', JSON.stringify(appState.settings.playlist));
  if (firestore) firestore.collection('settings').doc('global').set({ playlist: appState.settings.playlist }, { merge: true });
  setupAudioPlayer();
  renderAdminPlaylist();
}

// ============================
// OUTILS (Oeil Mdp, Dates)
// ============================
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === "password") { input.type = "text"; } else { input.type = "password"; }
}

function forgotPassword() {
  const email = prompt("Entrez votre adresse email pour recevoir un mot de passe temporaire :");
  if (!email) return;
  const user = appState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    const tempPass = Math.random().toString(36).slice(-8);
    alert(`✅ Par chance, vous êtes en mode Cloud Local !\n\nVotre mot de passe temporaire est : ${tempPass}\n\nNotez-le immédiatement, connectez-vous, puis mettez à jour votre compte.`);
    user.pass = tempPass;
    if (firestore) firestore.collection('users').doc(user.id).update({ pass: tempPass });
  } else {
    alert("❌ Aucune adresse email correspondante trouvée.");
  }
}

// Générer automatiquement la barre des mois selon le mois actuel
function setupMonthFilter() {
  const d = new Date();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  currentMonth = m; // Par défaut : le mois actuel !
  
  const bar = document.getElementById('monthFilterBar');
  if (!bar) return;

  const months = [
    {val:'all', lbl:'Toute l\'année'}, {val:'08',lbl:'Août'}, {val:'09',lbl:'Septembre'}, {val:'10',lbl:'Octobre'},
    {val:'11',lbl:'Novembre'}, {val:'12',lbl:'Décembre'}, {val:'01',lbl:'Janvier'}, {val:'02',lbl:'Février'},
    {val:'03',lbl:'Mars'}, {val:'04',lbl:'Avril'}, {val:'05',lbl:'Mai'}
  ];
  
  let html = '';
  months.forEach(mo => {
    const isAct = mo.val === currentMonth;
    html += `<button class="matchday-pill ${isAct?'active':''}" onclick="filterByMonth('${mo.val}')">${mo.lbl}</button>`;
  });
  bar.innerHTML = html;
}

// ============================
// NOYAU PRINCIPAL
// ============================
function init() {
  setupAudioPlayer();
  setupMonthFilter();
  
  if (currentUser) {
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
  }
}

function setupApp() {
  updateUI();
  renderMatches();
  renderLeaderboard();
  
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminPlaylist();
  }
}

function filterByMonth(m) {
  currentMonth = m;
  document.querySelectorAll('#monthFilterBar .matchday-pill').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMatches();
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let list = ALL_MATCHES;

  if (currentLeague !== 'all') list = list.filter(m => m.league === currentLeague);
  if (currentMonth !== 'all') {
    list = list.filter(m => {
      const parts = m.date.split('-');
      // Format 2026-08-21
      if (parts.length === 3) return parts[1] === currentMonth;
      // Format 21/08/2026
      const partsSlash = m.date.split('/');
      if (partsSlash.length === 3) return partsSlash[1] === currentMonth;
      return true;
    });
  }

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">Aucun match trouvé pour ce mois ou cette ligue.</p>';
    return;
  }

  let html = '';
  list.forEach(m => {
    const pred = (currentUser && currentUser.preds && currentUser.preds[m.id]) || { h:'', a:'' };
    html += `
      <div class="match-card">
        <div class="match-header"><span><strong>${m.league.toUpperCase()}</strong></span><span style="color:var(--gold)">📅 ${m.date}</span></div>
        <div class="match-teams">
          <div class="match-team home">${m.home}</div><div class="match-vs">VS</div><div class="match-team away">${m.away}</div>
        </div>
        <div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="-"><span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="-">
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

window.onload = init;
