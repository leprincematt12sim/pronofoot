// ============================================
// FICHIER : js/database.js
// RÔLE : Gérer la connexion à Firebase, lire et écrire les données
// ============================================

// Initialisation de Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(CONFIG.FIREBASE);
}
const firestore = firebase.firestore();

// L'état global de l'application (Ce qui est en mémoire)
let appState = {
  users: [],
  scores: {},
  groups: [],
  globalChat: [],
  settings: {
    themeColor: '#00E676',
    bgImage: '',
    authBgImage: '',
    dashboardBgImage: '',
    playlist: [],
    leagueBanners: {},
    leagueBackgrounds: {}
  }
};

let currentUser = JSON.parse(localStorage.getItem('pf_cloud_session')) || null;

// Fonction pour écouter la base de données en direct
function listenCloudData() {
  if (!firestore) return;

  // 1. Écouter les utilisateurs (Classements et Pronostics)
  firestore.collection('users').onSnapshot(snap => {
    appState.users = [];
    snap.forEach(doc => appState.users.push({ id: doc.id, ...doc.data() }));
    
    // Mettre à jour l'utilisateur actuel
    if (currentUser) {
      const u = appState.users.find(x => x.id === currentUser.id);
      if (u) currentUser = u;
    }
    
    // Si on a l'interface chargée, on met à jour l'écran
    if (typeof updateUI === "function") {
      recalculateAllCloudPoints();
      updateUI();
      renderLeaderboard();
      if (typeof renderMatches === "function") renderMatches();
    }
  });

  // 2. Écouter les Paramètres globaux et les Scores réels
  firestore.collection('settings').doc('global').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      appState.scores = data.scores || {};
      appState.settings = { ...appState.settings, ...data };
      
      if (typeof applyTheme === "function") {
        applyTheme();
        recalculateAllCloudPoints();
        updateUI();
        if (typeof renderMatches === "function") renderMatches();
        if (typeof renderAdminMatchList === "function" && currentUser?.role === 'admin') renderAdminMatchList();
      }
    }
  });
}