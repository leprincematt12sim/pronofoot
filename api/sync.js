const axios = require('axios');

// Mappage des IDs de ligues API-Football
const LEAGUE_IDS = {
  champions: 2,
  premier: 39,
  laliga: 140,
  seriea: 135,
  bundesliga: 78,
  ligue1: 61
};

module.exports = async (req, res) => {
  const apiKey = req.query.apiKey || process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "Clé API manquante" });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: { 'x-apisports-key': apiKey },
      params: { date: today }
    });

    const fixtures = response.data.response || [];
    const results = {};

    fixtures.forEach(f => {
      if (f.fixture.status.short === 'FT' || f.fixture.status.short === 'AET' || f.fixture.status.short === 'PEN') {
        const homeTeam = f.teams.home.name;
        const awayTeam = f.teams.away.name;
        const homeScore = f.goals.home;
        const awayScore = f.goals.away;

        results[`${homeTeam}_${awayTeam}`] = { h: homeScore, a: awayScore };
      }
    });

    return res.status(200).json({
      success: true,
      updatedMatches: Object.keys(results).length,
      scores: results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
