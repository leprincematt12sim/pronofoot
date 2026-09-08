const BONUS_CONFIG = [
  { id:'ucl_win', label:'🏆 Vainqueur Ligue des Champions', pts:75, teams:['Real Madrid','FC Barcelone','Manchester City','Bayern Munich','Paris Saint-Germain','Arsenal','Liverpool','Inter Milan','Borussia Dortmund','Atlético Madrid'] },
  { id:'pl_win', label:'🏴 Champion Premier League', pts:50, teams:['Manchester City','Arsenal','Liverpool','Manchester United','Tottenham','Newcastle'] },
  { id:'liga_win', label:'🇪🇸 Champion La Liga', pts:50, teams:['Real Madrid','FC Barcelone','Atlético Madrid'] },
  { id:'seriea_win', label:'🇮🇹 Champion Serie A', pts:50, teams:['Inter Milan','Juventus','AC Milan','Naples'] },
  { id:'buli_win', label:'🇩🇪 Champion Bundesliga', pts:50, teams:['Bayern Munich','Borussia Dortmund'] },
  { id:'l1_win', label:'🇫🇷 Champion Ligue 1', pts:50, teams:['Paris Saint-Germain','Olympique de Marseille'] }
];

const LEAGUE_INFO = {
  champions:{name:'Ligue des Champions',flag:'🏆',gradient:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)'},
  premier:{name:'Premier League',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',gradient:'linear-gradient(135deg,#3d195b,#6b2fa0)'},
  laliga:{name:'La Liga',flag:'🇪🇸',gradient:'linear-gradient(135deg,#ee8707,#f5a623)'},
  seriea:{name:'Serie A',flag:'🇮🇹',gradient:'linear-gradient(135deg,#024494,#0066cc)'},
  bundesliga:{name:'Bundesliga',flag:'🇩🇪',gradient:'linear-gradient(135deg,#d20515,#ff3333)'},
  ligue1:{name:'Ligue 1',flag:'🇫🇷',gradient:'linear-gradient(135deg,#091c3e,#1a3a6e)'}
};

const AVATAR_COLORS = ['#e94560','#00b894','#6c5ce7','#fdcb6e','#0984e3','#e17055','#00cec9','#fd79a8','#a29bfe','#55efc4'];

function generateDemoPredictions() {
  const preds = {};
  ALL_MATCHES.slice(0,60).forEach(m => {
    if (Math.random()>0.3) preds[m.id] = {h:Math.floor(Math.random()*4), a:Math.floor(Math.random()*3)};
  });
  return preds;
}

let db = {
  users: JSON.parse(localStorage.getItem('pf_users')) || null,
  scores: JSON.parse(localStorage.getItem('pf_scores')) || {},
  session: localStorage.getItem('pf_session') || null,
  announce: localStorage.getItem('pf_announce') || '',
  bgImage: localStorage.getItem('pf_bgImage') || '',
  leagueBanners: JSON.parse(localStorage.getItem('pf_banners')) || {},
  customRules: localStorage.getItem('pf_rules') || '',
  themeColor: localStorage.getItem('pf_theme') || '#e94560'
};

if (!db.users) {
  db.users = [
    { id:'admin', username:'Admin', email:'admin@pronofoot.com', pass:'admin123', role:'admin', points:0, preds:{}, bonuses:{} },
    { id:'u1', username:'Alex_PL', email:'alex@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u2', username:'Sophie_L1', email:'sophie@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u3', username:'Marco_SerieA', email:'marco@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u4', username:'Karim_UCL', email:'karim@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u5', username:'Lucas_Buli', email:'lucas@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u6', username:'Emma_Liga', email:'emma@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} },
    { id:'u7', username:'Hugo_OM', email:'hugo@test.com', pass:'123456', role:'user', points:0, preds:generateDemoPredictions(), bonuses:{} }
  ];
  localStorage.setItem('pf_users', JSON.stringify(db.users));
}

let currentUser = null;
let currentLeague = 'all';

function calcPts(pred, score) {
  if (!pred||pred.h===''||pred.a===''||!score) return 0;
  if (pred.h===score.h&&pred.a===score.a) return 5;
  const pR=pred.h>pred.a?'H':pred.h<pred.a?'A':'D';
  const sR=score.h>score.a?'H':score.h<score.a?'A':'D';
  return pR===sR?3:0;
}

function recalcAllPoints() {
  db.users.forEach(u => {
    let t=0;
    for (const [id,p] of Object.entries(u.preds||{})) { const s=db.scores[id]; if(s) t+=calcPts(p,s); }
    u.points=t;
  });
  saveDB();
}

function getUserStats(u) {
  let ex=0,co=0,wr=0,pe=0;
  for (const [id,p] of Object.entries(u.preds||{})) {
    const s=db.scores[id]; if(!s){pe++;continue;}
    const pts=calcPts(p,s); if(pts===5)ex++; else if(pts===3)co++; else wr++;
  }
  return {exact:ex,correct:co,wrong:wr,pending:pe,total:Object.keys(u.preds||{}).length};
}

function getSorted() { return [...db.users].sort((a,b)=>b.points-a.points); }
function getAvatarColor(u) { return AVATAR_COLORS[u.charCodeAt(0)%AVATAR_COLORS.length]; }

function saveDB() {
  localStorage.setItem('pf_users',JSON.stringify(db.users));
  localStorage.setItem('pf_scores',JSON.stringify(db.scores));
}

function applyTheme() {
  document.documentElement.style.setProperty('--accent', db.themeColor);
  if (db.bgImage) {
    document.documentElement.style.setProperty('--bg-image', 'url('+db.bgImage+')');
    document.body.classList.add('has-bg-image');
  } else {
    document.body.classList.remove('has-bg-image');
  }
}

function init() {
  applyTheme();
  if (db.session) currentUser = db.users.find(u=>u.id===db.session);
  if (!currentUser) { document.getElementById('authScreen').style.display='flex'; }
  else { document.getElementById('authScreen').style.display='none'; recalcAllPoints(); setupApp(); }
}

function setupApp() {
  updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderBonuses();
  if (currentUser.role==='admin') {
    document.getElementById('adminNavBtn').style.display='flex';
    renderAdminMatchList(); renderAdminStats(); renderAdminLeagueBanners();
    document.getElementById('adminBgImage').value = db.bgImage;
    document.getElementById('adminRulesInput').value = db.customRules;
  }
  if (db.announce) { document.getElementById('announcementBox').style.display='block'; document.getElementById('announcementText').textContent=db.announce; }
  if (db.customRules) { document.getElementById('rulesContent').innerHTML += '<div class="rules-box"><h3>📌 Règles supplémentaires</h3><p>'+db.customRules+'</p></div>'; }
}

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('authError').style.display='none';
  if(tab==='login'){document.querySelectorAll('.auth-tab')[0].classList.add('active');document.getElementById('loginForm').style.display='block';document.getElementById('registerForm').style.display='none';}
  else{document.querySelectorAll('.auth-tab')[1].classList.add('active');document.getElementById('loginForm').style.display='none';document.getElementById('registerForm').style.display='block';}
}

function handleLogin(e) {
  e.preventDefault();
  const u=document.getElementById('loginUser').value.trim(), p=document.getElementById('loginPass').value;
  const found=db.users.find(x=>(x.username.toLowerCase()===u.toLowerCase()||x.email.toLowerCase()===u.toLowerCase())&&x.pass===p);
  if(!found){document.getElementById('authError').textContent='Identifiant ou mot de passe incorrect.';document.getElementById('authError').style.display='block';return;}
  currentUser=found; localStorage.setItem('pf_session',found.id);
  document.getElementById('authScreen').style.display='none'; recalcAllPoints(); setupApp();
}

function handleRegister(e) {
  e.preventDefault();
  const u=document.getElementById('regUser').value.trim(), em=document.getElementById('regEmail').value.trim(), p=document.getElementById('regPass').value;
  if(db.users.find(x=>x.username.toLowerCase()===u.toLowerCase())){document.getElementById('authError').textContent='Pseudo déjà pris.';document.getElementById('authError').style.display='block';return;}
  const nu={id:'u_'+Date.now(),username:u,email:em,pass:p,role:'user',points:0,preds:{},bonuses:{}};
  db.users.push(nu); saveDB(); currentUser=nu; localStorage.setItem('pf_session',nu.id);
  document.getElementById('authScreen').style.display='none'; setupApp();
}

function handleLogout() { localStorage.removeItem('pf_session'); location.reload(); }

function updateUI() {
  if(!currentUser)return;
  document.getElementById('navPoints').textContent='⭐ '+currentUser.points+' pts';
  document.getElementById('navAvatar').textContent=currentUser.username[0].toUpperCase();
  document.getElementById('navAvatar').style.background=getAvatarColor(currentUser.username);
  document.getElementById('welcomeMsg').textContent='Bienvenue, '+currentUser.username+' ! 👋';
  const st=getUserStats(currentUser);
  document.getElementById('statPoints').textContent=currentUser.points;
  document.getElementById('statPredictions').textContent=st.total;
  document.getElementById('statExact').textContent=st.exact;
  const sorted=getSorted(), rank=sorted.findIndex(u=>u.id===currentUser.id);
  document.getElementById('statRank').textContent=rank>=0?'#'+(rank+1):'-';
  document.getElementById('profileBigAvatar').textContent=currentUser.username[0].toUpperCase();
  document.getElementById('profileBigAvatar').style.background=getAvatarColor(currentUser.username);
  document.getElementById('profileUsername').textContent=currentUser.username;
  document.getElementById('profileEmail').textContent=currentUser.email;
  document.getElementById('profileRole').textContent=currentUser.role==='admin'?'⭐ Administrateur':'🎮 Joueur';
}

function renderDashboardLeaderboard() {
  const sorted=getSorted(), max=sorted[0]?.points||1;
  let html='';
  sorted.slice(0,5).forEach((u,i)=>{
    const isMe=currentUser&&u.id===currentUser.id, color=getAvatarColor(u.username);
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'', pct=max>0?Math.round((u.points/max)*100):0;
    html+=`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${isMe?'rgba(233,69,96,0.15)':'var(--bg-card)'};border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:8px;margin-bottom:6px">
      <span style="font-weight:800;min-width:30px;color:${i<3?'var(--gold)':'var(--text-muted)'}">${medal||'#'+(i+1)}</span>
      <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.8rem">${u.username[0].toUpperCase()}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:0.9rem">${u.username}</div><div style="height:4px;background:var(--bg-dark);border-radius:2px;margin-top:4px"><div style="height:100%;width:${pct}%;background:${color};border-radius:2px"></div></div></div>
      <span style="font-weight:800;color:var(--gold);min-width:55px;text-align:right">${u.points} pts</span></div>`;
  });
  document.getElementById('dashboardLeaderboard').innerHTML=html;
}

function renderLeaderboard() {
  const sorted=getSorted();
  let pod='';
  if(sorted.length>=3){
    const p=[sorted[1],sorted[0],sorted[2]], h=[100,140,75], m=['🥈','🥇','🥉'], bg=['var(--silver)','var(--gold)','var(--bronze)'];
    pod='<div style="display:flex;justify-content:center;align-items:flex-end;gap:10px;margin-bottom:20px">';
    p.forEach((u,i)=>{if(!u)return;const c=getAvatarColor(u.username);
      pod+=`<div style="text-align:center;flex:1;max-width:120px"><div style="font-size:1.5rem">${m[i]}</div><div style="width:45px;height:45px;border-radius:50%;background:${c};display:flex;align-items:center;justify-content:center;font-weight:bold;margin:5px auto;border:3px solid ${bg[i]}">${u.username[0].toUpperCase()}</div><div style="font-weight:700;font-size:0.85rem">${u.username}</div><div style="font-weight:800;color:var(--gold)">${u.points} pts</div><div style="height:${h[i]}px;background:linear-gradient(to top,${bg[i]},transparent);border-radius:8px 8px 0 0;margin-top:8px;opacity:0.3"></div></div>`;
    });
    pod+='</div>';
  }
  document.getElementById('podiumContainer').innerHTML=pod;
  let html='<table class="leaderboard-table"><thead><tr><th>#</th><th>Joueur</th><th>Pronos</th><th>✅</th><th>🎯</th><th>Points</th></tr></thead><tbody>';
  sorted.forEach((u,i)=>{
    const isMe=currentUser&&u.id===currentUser.id, c=getAvatarColor(u.username), st=getUserStats(u);
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    html+=`<tr class="${isMe?'current-user':''}"><td>${medal}</td><td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:${c};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.7rem">${u.username[0].toUpperCase()}</div>${u.username} ${isMe?'<span style="color:var(--accent);font-size:0.7rem">(toi)</span>':''}</div></td><td>${st.total}</td><td style="color:var(--gold)">${st.exact}</td><td style="color:var(--green)">${st.correct}</td><td>${u.points} pts</td></tr>`;
  });
  html+='</tbody></table>';
  document.getElementById('leaderboardContainer').innerHTML=html;
}

function renderMatches() {
  const container=document.getElementById('matchesContainer');
  let list=ALL_MATCHES;
  if(currentLeague!=='all') list=ALL_MATCHES.filter(m=>m.league===currentLeague);

  // Bannière championnat
  const bannerArea=document.getElementById('leagueBannerArea');
  if(currentLeague!=='all'&&LEAGUE_INFO[currentLeague]){
    const li=LEAGUE_INFO[currentLeague];
    const bannerImg=db.leagueBanners[currentLeague];
    const bgStyle=bannerImg?'background-image:url('+bannerImg+')':'background:'+li.gradient;
    bannerArea.innerHTML=`<div class="league-banner" style="${bgStyle}"><span>${li.flag} ${li.name}</span></div>`;
  } else { bannerArea.innerHTML=''; }

  let html='';
  list.forEach(m=>{
    const pred=(currentUser.preds&&currentUser.preds[m.id])||{h:'',a:''};
    const score=db.scores[m.id], done=!!score;
    const li=LEAGUE_INFO[m.league]||{name:m.league,flag:'⚽'};
    let res='';
    if(done){const pts=calcPts(pred,score);const cls=pts===5?'pts-exact':pts===3?'pts-correct':'pts-wrong';const lbl=pts===5?'🎯 Exact +5':pts===3?'✅ Résultat +3':'❌ 0';res=`<div class="match-result-badge ${cls}">Final: ${score.h}-${score.a} | ${lbl}</div>`;}
    html+=`<div class="match-card ${done?'finished':''}"><div class="match-header"><span>${li.flag} <strong>${li.name}</strong></span><span style="color:var(--gold)">📅 ${m.date}</span></div><div class="match-teams"><div class="match-team home">${m.home}</div><div class="match-vs">${done?score.h+' - '+score.a:'VS'}</div><div class="match-team away">${m.away}</div></div>${!done?`<div class="match-prediction"><input type="number" min="0" max="15" value="${pred.h}" id="h_${m.id}" placeholder="-"><span>:</span><input type="number" min="0" max="15" value="${pred.a}" id="a_${m.id}" placeholder="-"></div>`:''}${res}</div>`;
  });
  container.innerHTML=html;
}

function saveAll() {
  if(!currentUser)return; if(!currentUser.preds)currentUser.preds={};
  let c=0;
  document.querySelectorAll('.match-prediction input').forEach(input=>{
    const id=input.id.substring(2),h=document.getElementById('h_'+id)?.value,a=document.getElementById('a_'+id)?.value;
    if(h!==''&&a!==''){currentUser.preds[id]={h:parseInt(h),a:parseInt(a)};c++;}
  });
  const idx=db.users.findIndex(u=>u.id===currentUser.id); if(idx!==-1)db.users[idx]=currentUser;
  recalcAllPoints(); saveDB(); updateUI(); renderLeaderboard(); renderDashboardLeaderboard();
  alert(c+' pronostics sauvegardés ! ✅');
}

function renderBonuses() {
  const c=document.getElementById('bonusesContainer'), mb=currentUser.bonuses||{};
  c.innerHTML=BONUS_CONFIG.map(b=>{const sel=mb[b.id]||'';const opts=b.teams.map(t=>`<option value="${t}" ${t===sel?'selected':''}>${t}</option>`).join('');return`<div class="admin-card"><h4 style="font-size:0.95rem">${b.label} <span style="color:var(--gold)">(+${b.pts})</span></h4><select id="bonus_${b.id}" style="width:100%;margin-top:8px;padding:8px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:6px"><option value="">-- Choisir --</option>${opts}</select></div>`;}).join('');
}

function saveBonuses() {
  if(!currentUser)return; if(!currentUser.bonuses)currentUser.bonuses={};
  BONUS_CONFIG.forEach(b=>{const v=document.getElementById('bonus_'+b.id)?.value;if(v)currentUser.bonuses[b.id]=v;});
  const idx=db.users.findIndex(u=>u.id===currentUser.id); if(idx!==-1)db.users[idx]=currentUser;
  saveDB(); alert('Bonus sauvegardés ! 🎯');
}

// === ADMIN ===
function renderAdminMatchList() {
  let html='';
  ALL_MATCHES.slice(0,50).forEach(m=>{
    const s=db.scores[m.id], li=LEAGUE_INFO[m.league]||{flag:'⚽'};
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><span style="font-size:0.75rem;color:var(--text-dim);min-width:70px">${m.date}</span><span>${li.flag}</span><span style="flex:1;font-size:0.85rem;min-width:140px">${m.home} vs ${m.away}</span><input type="number" min="0" max="15" value="${s?s.h:''}" id="ah_${m.id}" placeholder="H" style="width:38px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold"><span>-</span><input type="number" min="0" max="15" value="${s?s.a:''}" id="aa_${m.id}" placeholder="A" style="width:38px;padding:5px;text-align:center;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:4px;font-weight:bold"><button class="btn btn-primary btn-xs" onclick="adminSaveScore('${m.id}')">OK</button><span style="font-size:0.7rem;color:${s?'var(--green)':'var(--text-dim)'}">${s?'✅':'⏳'}</span></div>`;
  });
  document.getElementById('adminMatchList').innerHTML=html;
}

function adminSaveScore(id) {
  const h=parseInt(document.getElementById('ah_'+id)?.value), a=parseInt(document.getElementById('aa_'+id)?.value);
  if(isNaN(h)||isNaN(a)){alert('Entrez les 2 scores !');return;}
  db.scores[id]={h,a}; recalcAllPoints(); saveDB(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList(); renderAdminStats();
}

function adminSimulateScores() {
  let c=0; ALL_MATCHES.filter(m=>!db.scores[m.id]).slice(0,10).forEach(m=>{db.scores[m.id]={h:Math.floor(Math.random()*4),a:Math.floor(Math.random()*3)};c++;});
  recalcAllPoints(); saveDB(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList(); renderAdminStats();
  alert(c+' scores simulés ! 🎲');
}

function adminSimulateAll() {
  if(!confirm('Simuler TOUT ?'))return; let c=0;
  ALL_MATCHES.forEach(m=>{if(!db.scores[m.id]){db.scores[m.id]={h:Math.floor(Math.random()*4),a:Math.floor(Math.random()*3)};c++;}});
  recalcAllPoints(); saveDB(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList(); renderAdminStats();
  alert(c+' scores simulés ! 🎲');
}

function adminResetScores() {
  if(!confirm('Supprimer tous les scores ?'))return;
  db.scores={}; recalcAllPoints(); saveDB(); updateUI(); renderMatches(); renderLeaderboard(); renderDashboardLeaderboard(); renderAdminMatchList(); renderAdminStats();
}

function renderAdminStats() {
  const t=ALL_MATCHES.length, s=Object.keys(db.scores).length, p=db.users.reduce((a,u)=>a+Object.keys(u.preds||{}).length,0);
  document.getElementById('adminStats').innerHTML=`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Matchs</span><strong>${t}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Scores</span><strong style="color:var(--green)">${s}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Joueurs</span><strong>${db.users.length}</strong></div><div style="display:flex;justify-content:space-between;padding:6px 0"><span>Pronostics</span><strong style="color:var(--gold)">${p}</strong></div>`;
}

// ADMIN IMAGES & APPARENCE
function previewBgImage() {
  const url=document.getElementById('adminBgImage').value.trim();
  const prev=document.getElementById('bgPreview');
  if(url){prev.src=url;prev.style.display='block';} else {prev.style.display='none';}
}

function adminSaveBgImage() {
  const url=document.getElementById('adminBgImage').value.trim();
  db.bgImage=url; localStorage.setItem('pf_bgImage',url); applyTheme();
  alert('Image de fond appliquée ! 🖼️');
}

function adminRemoveBgImage() {
  db.bgImage=''; localStorage.setItem('pf_bgImage',''); applyTheme();
  document.getElementById('adminBgImage').value='';
  document.getElementById('bgPreview').style.display='none';
  alert('Fond supprimé !');
}

function renderAdminLeagueBanners() {
  const container=document.getElementById('adminLeagueBanners');
  let html='';
  for(const [key,li] of Object.entries(LEAGUE_INFO)){
    const url=db.leagueBanners[key]||'';
    html+=`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
      <span style="min-width:120px;font-weight:600">${li.flag} ${li.name}</span>
      <input type="text" value="${url}" id="banner_${key}" placeholder="URL image..." style="flex:1;min-width:200px;padding:8px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:6px;font-size:0.85rem">
      ${url?`<img src="${url}" style="width:60px;height:35px;object-fit:cover;border-radius:4px">`:''}
    </div>`;
  }
  container.innerHTML=html;
}

function adminSaveLeagueBanners() {
  for(const key of Object.keys(LEAGUE_INFO)){
    const url=document.getElementById('banner_'+key)?.value?.trim()||'';
    if(url) db.leagueBanners[key]=url; else delete db.leagueBanners[key];
  }
  localStorage.setItem('pf_banners',JSON.stringify(db.leagueBanners));
  renderMatches();
  alert('Bannières sauvegardées ! 🏟️');
}

function adminPublishAnnouncement() {
  const t=document.getElementById('adminAnnounceInput').value.trim(); if(!t)return;
  db.announce=t; localStorage.setItem('pf_announce',t);
  document.getElementById('announcementBox').style.display='block';
  document.getElementById('announcementText').textContent=t;
  alert('Annonce publiée ! 📢');
}

function adminSaveRules() {
  const t=document.getElementById('adminRulesInput').value.trim();
  db.customRules=t; localStorage.setItem('pf_rules',t);
  alert('Règles sauvegardées ! 📜');
}

function changeTheme(c) {
  db.themeColor=c; localStorage.setItem('pf_theme',c);
  document.documentElement.style.setProperty('--accent',c);
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.remove('active'));
  event.target.classList.add('active');
}

function filterLeague(l) {
  currentLeague=l;
  document.querySelectorAll('#page-matches .league-tab').forEach(t=>t.classList.remove('active'));
  event.target.classList.add('active');
  renderMatches();
}

function navigateTo(p) {
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('page-'+p);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`[onclick="navigateTo('${p}')"]`);
  if(btn) btn.classList.add('active');
  if(p==='admin'){renderAdminMatchList();renderAdminStats();renderAdminLeagueBanners();}
  if(p==='leaderboard') renderLeaderboard();
  window.scrollTo({top:0,behavior:'smooth'});
}

window.onload=init;
