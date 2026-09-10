// ============================================
// PRONOFOOT — ARCHITECTURE OFFICIELLE DISTRIBUÉE
// 🗄️ Base de données : SUPABASE
// 🖼️ Médias (Fichiers, MP3, Photos HD) : CLOUDINARY
// ⚽ Scores réels : API-SPORTS
// ============================================

// --- 🗄️ IDENTIFIANTS SUPABASE ---
const SUPABASE_URL = "https://ktcsrjyuzbjnhkkglwcm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y3Nyanl1emJqbmhra2dsd2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjA2MjIsImV4cCI6MjEwNDYzNjYyMn0.6MkmXkU-ArSogrci6YJi2QiSpT-TzR83Za9Qa0EpLHk";
let supabase = null;
try { if (window.supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){}

// --- 🖼️ IDENTIFIANTS CLOUDINARY ---
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/pronofoot/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "pronofoot_upload";

// --- ⚽ IDENTIFIANTS API-SPORTS ---
const REAL_API_KEY = "5eb745d2e42b3f1e72fddff81191592e";

const TEAM_CRESTS = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "FC Barcelone": "https://media.api-sports.io/football/teams/529.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png",
  "Olympique de Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png"
};

const LEAGUE_INFO = {
  champions:{ name:'Ligue des Champions', flag:'🏆', accent:'#f5c518', defaultBg:'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1920&q=80' },
  premier:{ name:'Premier League', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent:'#3d195b', defaultBg:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1920&q=80' },
  laliga:{ name:'La Liga', flag:'🇪🇸', accent:'#ee8707', defaultBg:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80' },
  seriea:{ name:'Serie A', flag:'🇮🇹', accent:'#024494', defaultBg:'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&w=1920&q=80' },
  bundesliga:{ name:'Bundesliga', flag:'🇩🇪', accent:'#d20515', defaultBg:'https://images.unsplash.com/photo-1489944445391-11dd35572130?auto=format&fit=crop&w=1920&q=80' },
  ligue1:{ name:'Ligue 1', flag:'🇫🇷', accent:'#091c3e', defaultBg:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1920&q=80' }
};

let appState = {
  users: JSON.parse(localStorage.getItem('pf_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores')) || {},
  settings: { themeColor: '#00E676', bgImage: '', playlist: [] }
};

let currentUser = JSON.parse(localStorage.getItem('pf_session')) || null;
let currentLeague = 'all';
let currentMonth = 'all';

function getTeamCrest(name) { return TEAM_CRESTS[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1c&color=fff&size=64&bold=true`; }

// ==========================================
// 🖼️ CLOUDINARY API : Envoi de Fichiers Lourds (Gratuit et Rapide)
// ==========================================
async function uploadToCloudinary(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  alert("⏳ Upload en cours vers le serveur Cloudinary...");

  try {
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.secure_url) {
      const url = data.secure_url;
      
      if (type === 'avatar' && currentUser) {
        currentUser.avatar = url;
        const idx = appState.users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) appState.users[idx].avatar = url;
        localStorage.setItem('pf_session', JSON.stringify(currentUser));
        if (supabase) { await supabase.from('profiles').update({ avatar: url }).eq('id', currentUser.id); }
        alert("✅ Photo de profil mise à jour !");
        updateUI(); renderLeaderboard();
      }
      else if (type === 'music') {
        const newSong = { name: file.name.replace('.mp3', ''), src: url };
        if (!appState.settings.playlist) appState.settings.playlist = [];
        appState.settings.playlist.push(newSong);
        if (supabase) { await supabase.from('app_settings').update({ playlist: appState.settings.playlist }).eq('id', 'global'); }
        setupAudioPlayer(); renderAdminPlaylist();
        alert(`🎵 Musique ajoutée avec succès !`);
      }
    } else {
      alert("❌ Erreur Cloudinary (Vérifiez le nom de l'Upload Preset).");
    }
  } catch (err) {
    alert("❌ Échec de la connexion à Cloudinary : " + err.message);
  }
}

// ==========================================
// ⚽ API-SPORTS : Synchro des Vrais Scores
// ==========================================
async function saveAndSyncApiSports() {
  const btn = document.getElementById('btnSyncApi');
  if(btn) { btn.innerHTML = "⏳ Recherche des scores réels..."; btn.disabled = true; }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayStr}`, {
      method: "GET", headers: { "x-apisports-key": REAL_API_KEY }
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

    localStorage.setItem('pf_scores', JSON.stringify(appState.scores));
    if (supabase) { await supabase.from('app_settings').update({ scores: appState.scores }).eq('id', 'global'); }

    recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert(`✅ Merveilleux ! ${count} score(s) réel(s) synchronisé(s) avec succès !`);
  } catch (err) {
    if(btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert("❌ Erreur de connexion avec l'API Sports : " + err.message);
  }
}

// ==========================================
// 🗄️ SUPABASE : Base de Données SQL
// ==========================================
async function fetchSupabaseData() {
  if (!supabase) return;
  try {
    const { data: profiles, error: errProf } = await supabase.from('profiles').select('*');
    if (!errProf && profiles) { appState.users = profiles; localStorage.setItem('pf_users', JSON.stringify(appState.users)); }
    
    const { data: settingsData, error: errSet } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
    if (!errSet && settingsData) {
      appState.scores = settingsData.scores || {};
      if (settingsData.bg_image) appState.settings.bgImage = settingsData.bg_image;
      if (settingsData.playlist) appState.settings.playlist = settingsData.playlist;
      localStorage.setItem('pf_scores', JSON.stringify(appState.scores));
    }
    
    recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  } catch(e) {}
}

function parseMatchDate(dateStr) {
  if (!dateStr) return new Date(2099, 0, 1);
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
  }
  return new Date(dateStr);
}
function hasMatchStarted(dateStr) {
  const matchDate = parseMatchDate(dateStr);
  if (isNaN(matchDate.getTime())) return false;
  return new Date() > matchDate;
}

function calcPts(pred, score) {
  if (!pred || pred.h==='' || pred.a==='' || !score) return 0;
  if (pred.h===score.h && pred.a===score.a) return 5;
  const pR = pred.h>pred.a?'H':pred.h<pred.a?'A':'D';
  const sR = score.h>score.a?'H':score.h<score.a?'A':'D';
  return pR===sR?3:0;
}

function recalcAllPoints() {
  appState.users.forEach(u => {
    let t = 0;
    for (const [id, p] of Object.entries(u.preds || {})) { const s = appState.scores[id]; if (s) t += calcPts(p, s); }
    u.points = t;
  });
}

function getUserStats(u) {
  let ex=0, co=0, wr=0;
  let total = Object.keys(u.preds || {}).length;
  for (const [id, p] of Object.entries(u.preds || {})) {
    const s = appState.scores[id];
    if (s) { const pts = calcPts(p, s); if (pts===5) ex++; else if (pts===3) co++; else wr++; }
  }
  let winRate = total > 0 ? (((ex + co) / total) * 100).toFixed(0) : 0;
  let exactRate = total > 0 ? ((ex / total) * 100).toFixed(0) : 0;
  return { exact:ex, correct:co, wrong:wr, total, winRate, exactRate };
}

function getSorted() { return [...appState.users].sort((a,b) => b.points - a.points); }

// ==========================================
// DÉMARRAGE ET UI
// ==========================================
function init() {
  if (appState.users.length === 0) {
    appState.users.push({ id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{} });
  }
  recalcAllPoints();
  fetchSupabaseData();
  setupMonthFilter();

  if (currentUser) { document.getElementById('authScreen').style.display = 'none'; setupApp(); } 
  else { document.getElementById('authScreen').style.display = 'flex'; applyTheme(); }
}

function setupApp() {
  applyTheme(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
    if(document.getElementById('adminApiKeyInput')) document.getElementById('adminApiKeyInput').value = REAL_API_KEY;
  }
}

// 👁️ ANTI-TRICHE : Voir les pronos des autres (Visible avec "✔️ A parié" avant match, Dévoilé après match)
function toggleMatchPredictions(matchId, matchDateStr) {
  const el = document.getElementById('all_preds_' + matchId);
  if (!el) return;

  if (el.style.display === 'none') {
    const started = hasMatchStarted(matchDateStr);
    const isAdmin = (currentUser && currentUser.role === 'admin');
    const score = appState.scores[matchId];
    
    let html = '<div style="font-weight:bold;color:var(--gold);margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px">👥 Pronostics des joueurs :</div>';
    let count = 0;
    
    appState.users.forEach(u => {
      const pred = u.preds && u.preds[matchId];
      if (pred && pred.h !== '' && pred.a !== '') {
        count++;
        // Si le match n'a pas commencé ET que l'on n'est pas Admin : on masque le score
        if (!started && !isAdmin) {
          html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem"><span style="flex:1"><strong>${u.username}</strong></span><span style="color:var(--green)">✔️ A parié</span></div>`;
        } else {
          // Sinon on montre le score et les points gagnés
          let resLbl = '';
          if (score) { const pts = calcPts(pred, score); resLbl = `<span class="${pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong'}" style="margin-left:auto;font-weight:bold">(+${pts} pts)</span>`; }
          html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem"><span style="flex:1"><strong>${u.username}</strong></span><span style="background:var(--bg-body);padding:2px 8px;border-radius:4px;font-weight:bold">${pred.h} - ${pred.a}</span>${resLbl}</div>`;
        }
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
    const started = hasMatchStarted(m.date);
    const li = LEAGUE_INFO[m.league] || { name:m.league, flag:'⚽' };
    let totalPreds = 0; appState.users.forEach(u => { if (u.preds && u.preds[m.id] && u.preds[m.id].h !== '') totalPreds++; });

    let res = '';
    if (done) {
      const pts = calcPts(pred, score);
      const cls = pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';
      const lbl = pts===5?'🎯 Exact (+5)':pts===3?'✅ Bon (+3)':'❌ Faux (0)';
      res = `<div class="match-result-badge ${cls}">Score Final : ${score.h} - ${score.a} | ${lbl}</div>`;
    }

    const disableInput = (started || done) ? 'disabled' : '';

    html += `
      <div class="match-card ${done?'finished':''}">
        <div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><span style="color:var(--gold)">📅 ${m.date}</span></div>
        <div class="match-teams">
          <div class="match-team home"><span>${m.home}</span><img src="${getTeamCrest(m.home)}" class="team-crest"></div>
          <div class="match-vs">${done ? score.h + ' - ' + score.a : 'VS'}</div>
          <div class="match-team away"><img src="${getTeamCrest(m.away)}" class="team-crest"><span>${m.away}</span></div>
        </div>
        ${!done ? `<div class="match-prediction">
          <input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="H" ${disableInput}>
          <span>:</span>
          <input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="A" ${disableInput}>
        </div>` : ''}
        ${res}
        <div style="text-align:center;margin-top:12px;border-top:1px dashed var(--border);padding-top:10px">
          <button class="btn btn-secondary btn-xs" onclick="toggleMatchPredictions('${m.id}', '${m.date}')">👥 Voir les pronos (${totalPreds})</button>
        </div>
        <div id="all_preds_${m.id}" style="display:none;margin-top:10px;padding:10px;background:#111;border-radius:8px;border:1px solid var(--border)"></div>
      </div>`;
  });
  container.innerHTML = html;
}

async function saveAll() {
  if (!currentUser) return;
  if (!currentUser.preds) currentUser.preds = {};
  let count = 0;
  const btn = document.getElementById('btnSavePronos');
  if(btn) { btn.innerHTML = "⏳ Sauvegarde..."; btn.disabled = true; }

  document.querySelectorAll('.match-prediction input').forEach(input => {
    if (!input.disabled) {
      const id = input.id.substring(2);
      const h = document.getElementById('h_' + id)?.value;
      const a = document.getElementById('a_' + id)?.value;
      if (h !== '' && a !== '') { currentUser.preds[id] = { h: parseInt(h), a: parseInt(a) }; count++; }
    }
  });

  const idx = appState.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) appState.users[idx] = currentUser;

  if (supabase) { 
    try { await supabase.from('profiles').update({ preds: currentUser.preds }).eq('id', currentUser.id); } catch (err) {} 
  }
  
  localStorage.setItem('pf_session', JSON.stringify(currentUser));
  recalcAllPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  
  if(btn) { btn.innerHTML = "✅ "+count+" Sauvegardés"; btn.disabled = false; setTimeout(()=>{btn.innerHTML="💾 Sauvegarder Mes Pronos";}, 2000); }
}

function updateUI() {
  if (!currentUser) return;
  const st = getUserStats(currentUser);
  
  const wRate = document.getElementById('statWinRate'); if (wRate) wRate.textContent = st.winRate + '%';
  const eRate = document.getElementById('statExactRate'); if (eRate) eRate.textContent = st.exactRate + '%';
  
  // Reste du code UI classique...
}

window.onload = init;
