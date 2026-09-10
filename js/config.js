// ============================================
// FICHIER : js/config.js
// RÔLE : Stocker toutes les clés secrètes et configurations de base
// ============================================

const CONFIG = {
  // Clés Firebase (Ton Cloud)
  FIREBASE: {
    apiKey: "AIzaSyCINnc9gGuNl5oF_0GBYq4fnO6MMlW8DFs",
    authDomain: "pronofoot-89f3e.firebaseapp.com",
    projectId: "pronofoot-89f3e",
    storageBucket: "pronofoot-89f3e.firebasestorage.app",
    messagingSenderId: "163921400915",
    appId: "1:163921400915:web:90d3b4ffeb1cb1bd99a2a6"
  },
  
  // Clé API-Sports (Les Vrais Scores)
  API_SPORTS_KEY: "5eb745d2e42b3f1e72fddff81191592e",

  // Couleurs des avatars par défaut
  AVATAR_COLORS: ['#00E676','#00b894','#6c5ce7','#f5c518','#0984e3','#e17055','#00cec9'],

  // Informations sur les championnats
  LEAGUES: {
    champions: { name: 'Ligue des Champions', flag: '🏆', accent: '#f5c518' },
    premier: { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent: '#3d195b' },
    laliga: { name: 'La Liga', flag: '🇪🇸', accent: '#ee8707' },
    seriea: { name: 'Serie A', flag: '🇮🇹', accent: '#024494' },
    bundesliga: { name: 'Bundesliga', flag: '🇩🇪', accent: '#d20515' },
    ligue1: { name: 'Ligue 1', flag: '🇫🇷', accent: '#091c3e' }
  }
};