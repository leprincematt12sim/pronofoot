// ============================================
// FICHIER : js/admin.js
// RÔLE : Toutes les actions du panneau administrateur
// ============================================

// SYNCHRO API SPORTS (Scores réels automatiques)
async function saveAndSyncApiSports() {
  const btn = document.getElementById('btnSyncApi');
  if (btn) { btn.innerHTML = "⏳ Recherche des scores réels..."; btn.disabled = true; }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayStr}`, {
      method: "GET",
      headers: { "x-apisports-key": CONFIG.API_SPORTS_KEY }
    });

    const data = await res.json();
    const fixtures = data.response || [];
    let count = 0;

    fixtures.forEach(f => {
      const status = f.fixture.status.short;
      const homeName = f.teams.home.name.toLowerCase();
      const awayName = f.teams.away.name.toLowerCase();
      const match = ALL_MATCHES.find(m =>
        m.home.toLowerCase().includes(homeName) || m.away.toLowerCase().includes(awayName)
      );

      if (match) {
        if (['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(status)) {
          appState.scores[match.id] = { h: f.goals.home, a: f.goals.away, status: 'LIVE', elapsed: f.fixture.status.elapsed };
          count++;
        } else if (['FT', 'AET', 'PEN'].includes(status)) {
          appState.scores[match.id] = { h: f.goals.home, a: f.goals.away, status: 'FINISHED' };
          count++;
        }
      }
    });

    localStorage.setItem('pf_scores_v3', JSON.stringify(appState.scores));
    if (firestore) {
      await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
    }

    recalculateAllCloudPoints();
    updateUI();
    renderMatches();
    renderLeaderboard();
    renderDashboardLeaderboard();

    if (btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert(`✅ ${count} match(s) en direct ou terminé(s) actualisé(s) depuis l'API !`);
  } catch (err) {
    if (btn) { btn.innerHTML = "⚡ Synchro Vrais Scores"; btn.disabled = false; }
    alert("❌ Erreur API : " + err.message);
  }
}

// TESTEUR LIVE (Simuler des matchs en direct avec animation rouge)
function adminSimulateLiveMatch() {
  const upcoming = ALL_MATCHES.slice(0, 3);
  upcoming.forEach(m => {
    appState.scores[m.id] = {
      h: Math.floor(Math.random() * 3),
      a: Math.floor(Math.random() * 2),
      status: 'LIVE',
      elapsed: Math.floor(Math.random() * 70) + 15
    };
  });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  alert("🔴 3 Matchs sont passés EN DIRECT avec animation rouge !");
}

// SIMULER 10 SCORES ALÉATOIRES
function adminSimulateScores() {
  let c = 0;
  ALL_MATCHES.filter(m => !appState.scores[m.id]).slice(0, 10).forEach(m => {
    appState.scores[m.id] = { h: Math.floor(Math.random() * 4), a: Math.floor(Math.random() * 3), status: 'FINISHED' };
    c++;
  });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert(c + " scores simulés !");
}

// SIMULER TOUS LES SCORES
function adminSimulateAll() {
  if (!confirm('Simuler TOUS les matchs ?')) return;
  ALL_MATCHES.forEach(m => {
    if (!appState.scores[m.id]) {
      appState.scores[m.id] = { h: Math.floor(Math.random() * 4), a: Math.floor(Math.random() * 3), status: 'FINISHED' };
    }
  });
  if (firestore) firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert("Tous les matchs ont été simulés !");
}

// RÉINITIALISER TOUS LES SCORES
function adminResetScores() {
  if (!confirm('Supprimer tous les scores enregistrés ?')) return;
  appState.scores = {};
  if (firestore) firestore.collection('settings').doc('global').set({ scores: {} }, { merge: true });
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList();
  alert("Scores réinitialisés !");
}

// SAISIE MANUELLE D'UN SCORE
async function adminSaveScore(id) {
  const h = parseInt(document.getElementById('ah_' + id)?.value);
  const a = parseInt(document.getElementById('aa_' + id)?.value);
  if (isNaN(h) || isNaN(a)) { alert('Entrez les 2 scores !'); return; }
  appState.scores[id] = { h, a, status: 'FINISHED' };
  if (firestore) {
    try {
      await firestore.collection('settings').doc('global').set({ scores: appState.scores }, { merge: true });
    } catch (e) {}
  }
  recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
  alert('Score enregistré ! ⚡');
}

// RENDU DE LA LISTE ADMIN (Avec Barre de Recherche)
function renderAdminMatchList() {
  const container = document.getElementById('adminMatchList');
  if (!container) return;

  const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  let list = ALL_MATCHES;

  if (searchVal) {
    list = list.filter(m => m.home.toLowerCase().includes(searchVal) || m.away.toLowerCase().includes(searchVal));
  }

  let html = '';
  list.slice(0, 100).forEach(m => {
    const s = appState.scores[m.id];
    html += `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span>
        <span style="flex:1;font-size:0.85rem;min-width:140px"><strong>${m.home}</strong> vs <strong>${m.away}</strong></span>
        <input type="number" min="0" max="15" value="${s ? s.h : ''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px">
        <span>-</span>
        <input type="number" min="0" max="15" value="${s ? s.a : ''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-body);color:white;border-radius:4px">
        <button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">Valider</button>
      </div>`;
  });
  container.innerHTML = html;
}

// RENDU DES ARRIÈRE-PLANS PAR LIGUE (ADMIN)
function renderAdminLeagueBackgrounds() {
  const container = document.getElementById('adminLeagueBackgrounds');
  if (!container) return;
  let html = '';
  for (const [key, li] of Object.entries(CONFIG.LEAGUES)) {
    const url = (appState.settings.leagueBackgrounds && appState.settings.leagueBackgrounds[key]) || '';
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">📸 Changer fond
          <input type="file" accept="image/*" style="display:none" onchange="uploadLeagueBgFromFile(event, '${key}')">
        </label>
        ${url ? `<img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : ''}
      </div>`;
  }
  container.innerHTML = html;
}

// RENDU DES BANNIÈRES PAR LIGUE (ADMIN)
function renderAdminLeagueBanners() {
  const container = document.getElementById('adminLeagueBanners');
  if (!container) return;
  let html = '';
  for (const [key, li] of Object.entries(CONFIG.LEAGUES)) {
    const url = (appState.settings.leagueBanners && appState.settings.leagueBanners[key]) || '';
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <span style="min-width:140px;font-weight:600">${li.flag} ${li.name}</span>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">📸 Changer bannière
          <input type="file" accept="image/*" style="display:none" onchange="uploadBannerFromFile(event, '${key}')">
        </label>
        ${url ? `<img src="${url}" style="width:70px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : ''}
      </div>`;
  }
  container.innerHTML = html;
}

// RENDU DES STATS ADMIN (Cloud Globales)
function renderAdminStats() {
  const el = document.getElementById('adminStats');
  if (!el) return;
  const t = ALL_MATCHES.length;
  const s = Object.keys(appState.scores).length;
  const p = appState.users.reduce((a, u) => a + Object.keys(u.preds || {}).length, 0);
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs 2026-27</span><strong>${t}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Scores validés</span><strong style="color:var(--green)">${s}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Joueurs inscrits</span><strong>${appState.users.length}</strong></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Pronostics totaux sur le site</span><strong style="color:var(--gold);font-size:1.2rem">${p}</strong></div>`;
}

// PUBLICATION D'ANNONCE
function adminPublishAnnouncement() {
  const t = document.getElementById('adminAnnounceInput')?.value.trim();
  if (!t) return;
  appState.settings.announce = t;
  if (firestore) firestore.collection('settings').doc('global').set({ announce: t }, { merge: true });
  alert('Annonce publiée ! 📢');
}

// CHANGEMENT DE THÈME
function changeTheme(c) {
  appState.settings.themeColor = c;
  if (firestore) firestore.collection('settings').doc('global').set({ themeColor: c }, { merge: true });
  applyTheme();
}