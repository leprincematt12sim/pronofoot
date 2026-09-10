// ============================================
// FICHIER : js/auth.js
// RÔLE : Inscription, Connexion, Déconnexion, Mot de passe oublié
// ============================================

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('authError').style.display = 'none';
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const userOrEmail = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  btn.innerText = "⏳ Connexion...";
  btn.disabled = true;

  // Charger les utilisateurs depuis Firebase si nécessaire
  if (firestore && appState.users.length <= 1) {
    try {
      const snap = await firestore.collection('users').get();
      if (!snap.empty) appState.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {}
  }

  const found = appState.users.find(u =>
    (u.email.toLowerCase() === userOrEmail || u.username.toLowerCase() === userOrEmail) && u.pass === pass
  );

  if (found) {
    currentUser = found;
    localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
    document.getElementById('authScreen').style.display = 'none';
    setupApp();
  } else {
    document.getElementById('authError').textContent = 'Identifiant ou mot de passe incorrect.';
    document.getElementById('authError').style.display = 'block';
  }
  btn.innerText = "Se connecter →";
  btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const btn = document.getElementById('registerBtn');
  btn.innerText = "⏳ Création...";
  btn.disabled = true;

  if (appState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    document.getElementById('authError').textContent = 'Pseudo déjà utilisé.';
    document.getElementById('authError').style.display = 'block';
    btn.innerText = "Créer mon compte →";
    btn.disabled = false;
    return;
  }

  const newUser = {
    id: 'u_' + Date.now(),
    username,
    email,
    pass,
    role: 'user',
    points: 0,
    preds: {},
    createdAt: new Date().toISOString()
  };

  if (firestore) {
    try {
      const ref = await firestore.collection('users').add(newUser);
      newUser.id = ref.id;
    } catch (e) {}
  }

  appState.users.push(newUser);
  currentUser = newUser;
  localStorage.setItem('pf_cloud_session', JSON.stringify(currentUser));
  document.getElementById('authScreen').style.display = 'none';
  setupApp();
  btn.innerText = "Créer mon compte →";
  btn.disabled = false;
}

function handleLogout() {
  localStorage.removeItem('pf_cloud_session');
  currentUser = null;
  location.reload();
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

function forgotPassword() {
  const email = prompt("Entrez votre adresse email :");
  if (!email) return;
  const user = appState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    const tempPass = Math.random().toString(36).slice(-8);
    alert("✅ Mot de passe temporaire : " + tempPass + "\n\nNotez-le et connectez-vous.");
    user.pass = tempPass;
    if (firestore) firestore.collection('users').doc(user.id).update({ pass: tempPass });
  } else {
    alert("❌ Adresse email non trouvée.");
  }
}