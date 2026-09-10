// ============================================
// FICHIER : js/ui.js
// RÔLE : Affichage du Dashboard, Classements, Profil, Musique, Navigation
// ============================================

// COMPRESSION D'IMAGE POUR FIREBASE GRATUIT
function compressImage(file, maxWidth, quality, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
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

// UPLOAD D'AVATAR
async function uploadUserAvatar(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;
  compressImage(file, 150, 0.5, async function (dataUrl) {
    currentUser.avatar = dataUrl;
    const idx = appState.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) appState.users[idx].avatar = dataUrl;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    if (firestore) { try { await firestore.collection('users').doc(currentUser.id).update({ avatar: dataUrl }); } catch (err) {} }
    updateUI();
    alert("✅ Photo de profil enregistrée !");
  });
}

// UPLOAD FOND CONNEXION
function uploadAuthBgFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 800, 0.4, async function (dataUrl) {
    appState.settings.authBgImage = dataUrl;
    applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ authBgImage: dataUrl }, { merge: true }); } catch (err) {} }
    alert("✅ Fond de connexion mis à jour !");
  });
}

// UPLOAD FOND ACCUEIL
function uploadDashboardBgFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 800, 0.4, async function (dataUrl) {
    appState.settings.dashboardBgImage = dataUrl;
    applyTheme();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ dashboardBgImage: dataUrl }, { merge: true }); } catch (err) {} }
    alert("✅ Fond d'accueil mis à jour !");
  });
}

// UPLOAD FOND PAR CHAMPIONNAT
function uploadLeagueBgFromFile(event, leagueKey) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 800, 0.4, async function (dataUrl) {
    if (!appState.settings.leagueBackgrounds) appState.settings.leagueBackgrounds = {};
    appState.settings.leagueBackgrounds[leagueKey] = dataUrl;
    applyTheme();
    renderAdminLeagueBackgrounds();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ leagueBackgrounds: appState.settings.leagueBackgrounds }, { merge: true }); } catch (e) {} }
    alert(`✅ Fond d'écran configuré pour ${CONFIG.LEAGUES[leagueKey].name} !`);
  });
}

// UPLOAD BANNIÈRE PAR CHAMPIONNAT
function uploadBannerFromFile(event, leagueKey) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 800, 0.4, async function (dataUrl) {
    if (!appState.settings.leagueBanners) appState.settings.leagueBanners = {};
    appState.settings.leagueBanners[leagueKey] = dataUrl;
    renderMatches();
    renderAdminLeagueBanners();
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ leagueBanners: appState.settings.leagueBanners }, { merge: true }); } catch (e) {} }
    alert(`✅ Bannière d'en-tête mise à jour pour ${CONFIG.LEAGUES[leagueKey].name} !`);
  });
}

// UPLOAD MUSIQUE MP3
function adminAddMusic(event) {
  const file = event.target.files[0];
  if (!file || file.size > 8 * 1024 * 1024) { alert("Fichier trop grand (Max: 8 Mo)."); return; }
  const reader = new FileReader();
  reader.onload = async function (e) {
    const newSong = { name: file.name.replace('.mp3', ''), src: e.target.result };
    if (!appState.settings.playlist) appState.settings.playlist = [];
    appState.settings.playlist.push(newSong);
    if (firestore) { try { await firestore.collection('settings').doc('global').set({ playlist: appState.settings.playlist }, { merge: true }); } catch (err) {} }
    setupAudioPlayer();
    renderAdminPlaylist();
    alert(`🎵 Musique ajoutée : ${newSong.name}`);
  };
  reader.readAsDataURL(file);
}

function renderAdminPlaylist() {
  const cont = document.getElementById('adminPlaylistList');
  if (!cont || !appState.settings.playlist) return;
  cont.innerHTML = appState.settings.playlist.map((s, i) =>
    `<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid var(--border)">
      <span>${s.name}</span>
      <button class="btn btn-xs btn-secondary" onclick="adminRemoveSong(${i})">❌</button>
    </div>`
  ).join('');
}

function adminRemoveSong(index) {
  appState.settings.playlist.splice(index, 1);
  if (firestore) firestore.collection('settings').doc('global').set({ playlist: appState.settings.playlist }, { merge: true });
  setupAudioPlayer();
  renderAdminPlaylist();
}

// LECTEUR AUDIO
let audioPlayer = null, currentSongIndex = 0, isMusicPlaying = false, isShuffle = false;

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
  const icon = document.getElementById('musicStatusIcon');
  const btn = document.getElementById('musicPlayBtn');
  if (isMusicPlaying) {
    audioPlayer.pause(); isMusicPlaying = false; icon.textContent = "🎵"; if (btn) btn.textContent = "▶️";
  } else {
    audioPlayer.play().then(() => { isMusicPlaying = true; icon.textContent = "🔊"; if (btn) btn.textContent = "⏸"; }).catch(() => {});
  }
}

function nextSong() { let n = isShuffle ? Math.floor(Math.random() * appState.settings.playlist.length) : (currentSongIndex + 1); loadSong(n); if (isMusicPlaying) audioPlayer.play(); }
function prevSong() { loadSong(currentSongIndex - 1); if (isMusicPlaying) audioPlayer.play(); }
function toggleShuffle() { isShuffle = !isShuffle; const b = document.getElementById('musicShuffleBtn'); if (b) b.style.color = isShuffle ? 'var(--accent)' : 'var(--text-muted)'; }

function renderPlaylistUI() {
  const container = document.getElementById('playlistContainer');
  if (!container || !appState.settings.playlist) return;
  container.innerHTML = appState.settings.playlist.map((song, i) =>
    `<div class="playlist-item" onclick="loadSong(${i});if(!isMusicPlaying)toggleSiteMusic();">🎵 ${song.name}</div>`
  ).join('');
}

// PARTAGE WHATSAPP
function shareChallengeWhatsApp() {
  if (!currentUser) return;
  const sorted = getSorted();
  const rank = sorted.findIndex(u => u.id === currentUser.id) + 1;
  const st = getUserStats(currentUser);
  const url = window.location.href;
  const msg = `🏆 *PRONOFOOT 2026-27*\n👤 Joueur : *${currentUser.username}*\n⭐ Points : *${currentUser.points} pts*\n🥇 Rang : *#${rank > 0 ? rank : 1}*\n\n🔥 Rejoins-moi et fais tes pronostics :\n👉 ${url}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

// GESTION DU THÈME
function applyTheme() {
  document.documentElement.style.setProperty('--accent', appState.settings.themeColor || '#00E676');
  const authScreen = document.getElementById('authScreen');
  if (authScreen) {
    authScreen.style.backgroundImage = appState.settings.authBgImage ? `url('${appState.settings.authBgImage}')` : 'none';
    authScreen.style.backgroundSize = 'cover';
  }
  let bg = appState.settings.bgImage;
  if (currentLeague === 'dashboard' && appState.settings.dashboardBgImage) bg = appState.settings.dashboardBgImage;
  else if (currentLeague !== 'all' && currentLeague !== 'dashboard' && CONFIG.LEAGUES[currentLeague]) {
    bg = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[currentLeague]) || '';
  }
  document.documentElement.style.setProperty('--bg-image', bg ? `url('${bg}')` : 'none');
}

// MISE À JOUR DE L'INTERFACE
function getAvatarColor(u) { return CONFIG.AVATAR_COLORS[(u || 'A').charCodeAt(0) % CONFIG.AVATAR_COLORS.length]; }

function updateUI() {
  if (!currentUser) return;
  document.getElementById('navPoints').textContent = (currentUser.points || 0) + ' pts';
  const navAv = document.getElementById('navAvatar');
  if (currentUser.avatar) { navAv.textContent = ''; navAv.style.backgroundImage = `url('${currentUser.avatar}')`; navAv.style.backgroundSize = 'cover'; }
  else { navAv.style.backgroundImage = 'none'; navAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }

  const st = getUserStats(currentUser);
  document.getElementById('statPoints').textContent = currentUser.points || 0;
  document.getElementById('statPredictions').textContent = st.total;
  document.getElementById('statExact').textContent = st.exact;

  const sorted = getSorted();
  const rankIdx = sorted.findIndex(u => u.id === currentUser.id);
  const rankStr = rankIdx >= 0 ? '#' + (rankIdx + 1) : '#1';
  document.getElementById('statRank').textContent = rankStr;

  document.getElementById('profileUsername').textContent = currentUser.username || '-';
  document.getElementById('profileEmail').textContent = currentUser.email || '-';

  const profAv = document.getElementById('profileBigAvatar');
  if (profAv) {
    if (currentUser.avatar) { profAv.textContent = ''; profAv.style.backgroundImage = `url('${currentUser.avatar}')`; profAv.style.backgroundSize = 'cover'; }
    else { profAv.style.backgroundImage = 'none'; profAv.textContent = (currentUser.username || 'A')[0].toUpperCase(); }
  }

  if (sorted[0]) {
    document.getElementById('kingUsername').textContent = sorted[0].username;
    document.getElementById('kingPoints').textContent = sorted[0].points + ' pts';
  }

  if (appState.settings.announce) {
    document.getElementById('announcementBox').style.display = 'block';
    document.getElementById('announcementText').textContent = appState.settings.announce;
  }
}

// CLASSEMENT DASHBOARD (Top 5)
function renderDashboardLeaderboard() {
  const sorted = getSorted();
  const max = sorted[0]?.points || 1;
  let html = '';
  sorted.slice(0, 5).forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    const pct = max > 0 ? Math.round((u.points / max) * 100) : 0;
    const av = u.avatar
      ? `<div style="width:32px;height:32px;border-radius:50%;background-image:url('${u.avatar}');background-size:cover;background-position:center;border:1px solid var(--border)"></div>`
      : `<div style="width:32px;height:32px;border-radius:50%;background:${getAvatarColor(u.username)};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.8rem">${u.username[0].toUpperCase()}</div>`;

    html += `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe ? 'rgba(0,230,118,0.1)' : 'var(--bg-card)'};border:1px solid ${isMe ? 'var(--accent)' : 'var(--border)'};border-radius:8px;margin-bottom:6px">
        <span style="font-weight:800;min-width:30px;color:${i < 3 ? 'var(--gold)' : 'var(--text-muted)'}">${medal || '#' + (i + 1)}</span>
        ${av}
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.9rem">${u.username} ${u.role === 'admin' ? '⭐' : ''}</div>
          <div style="height:4px;background:var(--bg-body);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px"></div></div>
        </div>
        <span style="font-weight:800;color:var(--gold)">${u.points} pts</span>
      </div>`;
  });
  document.getElementById('dashboardLeaderboard').innerHTML = html;
}

// CLASSEMENT COMPLET (Page Classement)
function renderLeaderboard() {
  const sorted = getSorted();
  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅ Exact</th><th>🎯 Bon</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u, i) => {
    const isMe = currentUser && u.id === currentUser.id;
    const st = getUserStats(u);
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
    const av = u.avatar
      ? `<div style="width:26px;height:26px;border-radius:50%;background-image:url('${u.avatar}');background-size:cover;background-position:center;border:1px solid var(--border)"></div>`
      : `<div style="width:26px;height:26px;border-radius:50%;background:${getAvatarColor(u.username)};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.7rem">${u.username[0].toUpperCase()}</div>`;

    html += `
      <tr class="${isMe ? 'current-user' : ''}">
        <td>${medal}</td>
        <td><div style="display:flex;align-items:center;gap:8px">${av}<strong>${u.username}</strong> ${u.role === 'admin' ? '⭐' : ''}</div></td>
        <td>${st.total}</td>
        <td style="color:var(--gold);font-weight:bold">${st.exact}</td>
        <td style="color:var(--green);font-weight:bold">${st.correct}</td>
        <td style="font-size:1.1rem;font-weight:800">${u.points} pts</td>
      </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML = html;
}

// NAVIGATION
function navigateTo(p) {
  if (p === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("⛔ Accès refusé ! Réservé à l'administrateur.");
      return;
    }
  }

  if (p === 'dashboard') { currentLeague = 'dashboard'; applyTheme(); }
  else if (p === 'matches') { currentLeague = 'all'; applyTheme(); }

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if (btn) btn.classList.add('active');

  if (p === 'admin') {
    renderAdminMatchList();
    renderAdminLeagueBackgrounds();
    renderAdminLeagueBanners();
    renderAdminPlaylist();
    renderAdminStats();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// GROUPES PRIVÉS (Fonctions de base)
function showCreateGroupPrompt() {
  const name = prompt("Nom de votre Groupe Privé :");
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
    firestore.collection('groups').add(newGroup);
  }

  appState.groups.push(newGroup);
  alert(`✅ Groupe "${name}" créé !\nCode : ${code}`);
}

function showJoinGroupPrompt() {
  const code = prompt("Entrez le code du groupe (ex: GRP-ABCD) :");
  if (!code || !code.trim()) return;

  const cleanCode = code.trim().toUpperCase();
  const localGroup = appState.groups.find(g => g.code === cleanCode);

  if (localGroup) {
    if (currentUser && !localGroup.members.includes(currentUser.id)) {
      localGroup.members.push(currentUser.id);
    }
    alert(`🎉 Vous avez rejoint le groupe "${localGroup.name}" !`);
    return;
  }

  alert("❌ Code invalide.");
}

// CHAT GLOBAL (Fonctions de base)
function handleSendGlobalChatMessage(e) {
  e.preventDefault();
  if (!currentUser) return;
  const input = document.getElementById('globalChatInput');
  const txt = input.value.trim();
  if (!txt) return;
  input.value = '';

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const msgData = {
    senderId: currentUser.id,
    senderName: currentUser.username,
    text: txt,
    time: timeStr,
    timestamp: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : Date.now()
  };

  if (firestore) {
    try { firestore.collection('global_chat').add(msgData); } catch (e) {}
  }
}