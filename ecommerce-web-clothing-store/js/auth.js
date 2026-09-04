/* ============================================================
   js/auth.js
   All authentication logic: register, login, logout, password
   reset, profile update, and simple page-guard helpers.

   Depends on js/firebase.js being loaded first (uses the global
   `auth` handle it creates).
   ============================================================ */

/* ---------- Friendly error messages ---------- */
function friendlyAuthError(error) {
  const map = {
    "auth/email-already-in-use": "That email is already registered. Try logging in instead.",
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
    "auth/missing-password": "Please enter a password.",
  };
  return map[error.code] || error.message || "Something went wrong. Please try again.";
}

/* ---------- Register ---------- */
async function registerUser({ name, email, password }) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (name) {
    await cred.user.updateProfile({ displayName: name });
  }
  return cred.user;
}

/* ---------- Login ---------- */
async function loginUser({ email, password }) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

/* ---------- Logout ---------- */
async function logoutUser() {
  await auth.signOut();
}

/* ---------- Password reset ---------- */
async function sendResetEmail(email) {
  await auth.sendPasswordResetEmail(email);
}

/* ---------- Update profile (used on profile.html) ---------- */
async function updateDisplayName(newName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  await user.updateProfile({ displayName: newName });
}

/* ---------- Page guards ----------
   Call requireAuth() at the top of any page that should only be
   visible to signed-in users (e.g. profile.html, orders.html).
   Call redirectIfSignedIn() on login.html / register.html so an
   already-logged-in user skips straight past them.
------------------------------------------------------------- */
function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (!user) {
        window.location.href = redirectTo;
      } else {
        resolve(user);
      }
    });
  });
}

function redirectIfSignedIn(redirectTo = "profile.html") {
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = redirectTo;
  });
}

/* ---------- Small UI helper shared by the auth pages ---------- */
function setFormLoading(button, loading, loadingText, defaultText) {
  button.disabled = loading;
  button.textContent = loading ? loadingText : defaultText;
}

function showError(el, message) {
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}
