let firestore = null;
try {
  if (!firebase.apps.length) firebase.initializeApp(CONFIG.FIREBASE);
  firestore = firebase.firestore();
} catch (e) {}

let appState = {
  users: JSON.parse(localStorage.getItem('pf_local_users')) || [],
  scores: JSON.parse(localStorage.getItem('pf_scores_v3')) || {},
  groups: JSON.parse(localStorage.getItem('pf_groups_v3')) || [],
  settings: JSON.parse(localStorage.getItem('pf_settings')) || {
    themeColor: '#00E676', authBgImage: '', dashboardBgImage: '', bgImage: '',
    leagueBanners: {}, leagueBackgrounds: {}, playlist: [], announce: ''
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;

function listenCloudData() {
  if (!firestore) return;
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
      applyTheme(); recalculateAllCloudPoints(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard();
      if (currentUser && currentUser.role === 'admin') { renderAdminMatchList(); renderAdminLeagueBanners(); renderAdminLeagueBackgrounds(); renderAdminPlaylist(); }
    }
  });
}
