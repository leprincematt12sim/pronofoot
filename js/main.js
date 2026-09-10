// ============================================
// FICHIER : js/main.js
// RÔLE : Point d'entrée principal de l'application
// ============================================

function setupApp() {
  applyTheme();
  updateUI();
  renderMatches();
  renderLeaderboard();
  renderDashboardLeaderboard();
  setupAudioPlayer();

  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('adminNavBtn').style.display = 'flex';
    document.getElementById('topAdminBtn').style.display = 'block';
    renderAdminMatchList();
    renderAdminLeagueBackgrounds();
    renderAdminLeagueBanners();
    renderAdminPlaylist();
    renderAdminStats();
    if (document.getElementById('adminApiKeyInput')) {
      document.getElementById('adminApiKeyInput').value = CONFIG.API_SPORTS_KEY;
    }
  } else {
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('topAdminBtn').style.display = 'none';
  }
}

function init() {
  // Créer un admin par défaut si aucun utilisateur n'existe
  if (appState.users.length === 0) {
    appState.users.push({
      id: 'admin',
      username: 'Admin',
      email: 'admin@pronofoot.com',
      pass: 'admin123',
      role: 'admin',
      points: 0,
      preds: {}
    });
  }

  recalculateAllCloudPoints();
  listenCloudData();
  setupMonthFilter();

  if (currentUser) {
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
    applyTheme();
  }
}

window.onload = init;