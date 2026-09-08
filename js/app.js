let currentUser = JSON.parse(localStorage.getItem('pronof_user')) || {
  username: 'Joueur_1',
  points: 0,
  predictions: {}
};

let currentLeague = 'all';

function init() {
  updateUI();
  renderMatches();
  renderLeaderboard();
}

function updateUI() {
  document.getElementById('navPoints').textContent = '⭐ ' + currentUser.points + ' pts';
  document.getElementById('welcomeMsg').textContent = 'Bienvenue, ' + currentUser.username + ' ! 👋';
  document.getElementById('statPoints').textContent = currentUser.points;
  document.getElementById('statPredictions').textContent = Object.keys(currentUser.predictions).length;
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  let html = '';

  for (const [key, league] of Object.entries(CONFIG.LEAGUES)) {
    if (currentLeague !== 'all' && currentLeague !== key) continue;

    for (let i = 0; i < league.teams.length; i += 2) {
      const home = league.teams[i];
      const away = league.teams[i + 1] || league.teams[0];
      if (home === away) continue;

      const matchId = `${key}_${i}`;
      const pred = currentUser.predictions[matchId] || { home: '', away: '' };

      html += `
        <div class="match-card">
          <div class="match-header">${league.flag} ${league.name}</div>
          <div class="match-teams">
            <span>${home}</span>
            <span style="color:var(--accent)">VS</span>
            <span>${away}</span>
          </div>
          <div class="match-prediction">
            <input type="number" min="0" max="15" value="${pred.home}" id="h_${matchId}" placeholder="-">
            <span>:</span>
            <input type="number" min="0" max="15" value="${pred.away}" id="a_${matchId}" placeholder="-">
          </div>
        </div>`;
    }
  }

  container.innerHTML = html;
}

function saveAll() {
  const inputs = document.querySelectorAll('.match-prediction input');
  let count = 0;

  inputs.forEach(input => {
    const id = input.id.substring(2);
    const h = document.getElementById('h_' + id)?.value;
    const a = document.getElementById('a_' + id)?.value;

    if (h !== '' && a !== '') {
      currentUser.predictions[id] = { home: parseInt(h), away: parseInt(a) };
      count++;
    }
  });

  localStorage.setItem('pronof_user', JSON.stringify(currentUser));
  updateUI();
  alert(`${count} pronostics sauvegardés avec succès ! ✅`);
}

function renderLeaderboard() {
  const users = [
    { name: currentUser.username, pts: currentUser.points },
    { name: 'Alex_PL', pts: 45 },
    { name: 'Max_Buli', pts: 38 },
    { name: 'Sophie_L1', pts: 29 },
    { name: 'Marco_SerieA', pts: 21 }
  ].sort((a, b) => b.pts - a.pts);

  let html = '<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Points</th></tr></thead><tbody>';
  users.forEach((u, i) => {
    html += `<tr><td>#${i + 1}</td><td>${u.name}</td><td>${u.pts} pts</td></tr>`;
  });
  html += '</tbody></table>';

  document.getElementById('leaderboardContainer').innerHTML = html;
}

function filterLeague(league) {
  currentLeague = league;
  document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderMatches();
}

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const btn = document.querySelector(`[onclick="navigateTo('${page}')"]`);
  if (btn) btn.classList.add('active');
}

window.onload = init;
