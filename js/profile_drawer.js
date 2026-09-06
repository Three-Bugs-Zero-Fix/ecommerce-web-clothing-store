const overlay = document.getElementById("drawer-overlay");
const drawer = document.getElementById("profile-drawer");
const drawerBody = document.getElementById("drawer-body");
const profileBtn = document.getElementById("profile-btn");
const profileBtnContent = document.getElementById("profile-btn-content");
const closeBtn = document.getElementById("drawer-close");

function openDrawer() { overlay.classList.add("open"); drawer.classList.add("open"); }
function closeDrawer() { overlay.classList.remove("open"); drawer.classList.remove("open"); }
profileBtn.addEventListener("click", openDrawer);
closeBtn.addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

auth.onAuthStateChanged((user) => {
  updateProfileButton(user);

  if (!user) {
    drawerBody.innerHTML = signedOutHTML();
    return;
  }
  drawerBody.innerHTML = signedInHTML(user);
  wireEvents();
});

function updateProfileButton(user) {
  if (user) {
    const name = user.displayName || user.email || "?";
    profileBtnContent.textContent = name.charAt(0).toUpperCase();
    profileBtn.classList.remove("profile-btn-guest");
    profileBtn.classList.add("profile-btn-avatar");
  } else {
    profileBtnContent.textContent = "👤";
    profileBtn.classList.remove("profile-btn-avatar");
    profileBtn.classList.add("profile-btn-guest");
  }
}

function signedOutHTML() {
  return `
    <div class="drawer-signed-out">
      <div class="drawer-guest-icon">👤</div>
      <p>Sign in to view your profile and orders.</p>
      <a href="/pages/login.html" class="drawer-primary-btn">Log in</a>
      <a href="/pages/register.html" class="drawer-outline-btn">Create account</a>
    </div>`;
}

function signedInHTML(user) {
  const name = user.displayName || "Unnamed customer";
  const initial = name.charAt(0).toUpperCase();
  return `
    <div class="drawer-profile-head">
      <div class="drawer-avatar">${initial}</div>
      <div>
        <div class="drawer-name">${escapeHtml(name)}</div>
        <div class="drawer-email">${escapeHtml(user.email)}</div>
      </div>
    </div>

    <nav class="account-menu">
      <a href="/pages/dashboard.html" class="menu-item">
        <span class="menu-icon">${icon("dashboard")}</span>
        <span class="menu-label">Dashboard</span>
        <span class="menu-arrow">›</span>
      </a>
      <a href="/pages/orders.html" class="menu-item">
        <span class="menu-icon">${icon("orders")}</span>
        <span class="menu-label">My Orders</span>
        <span class="menu-arrow">›</span>
      </a>
      <a href="/pages/track-order.html" class="menu-item">
        <span class="menu-icon">${icon("track")}</span>
        <span class="menu-label">Track Order</span>
        <span class="menu-arrow">›</span>
      </a>
      <a href="/pages/wishlist.html" class="menu-item">
        <span class="menu-icon">${icon("heart")}</span>
        <span class="menu-label">Saved Designs</span>
        <span class="menu-arrow">›</span>
      </a>

      <div class="menu-divider"></div>

      <a href="/pages/payout.html" class="menu-item">
        <span class="menu-icon">${icon("payout")}</span>
        <span class="menu-label">Payout</span>
        <span class="menu-arrow">›</span>
      </a>

      <div class="menu-divider"></div>

      <button type="button" class="menu-item menu-item-danger" id="drawer-logout">
        <span class="menu-icon">${icon("logout")}</span>
        <span class="menu-label">Logout</span>
      </button>
    </nav>
  `;
}

function wireEvents() {
  document.getElementById("drawer-logout").addEventListener("click", async () => {
    await logoutUser();
    closeDrawer();
  });
}

function icon(name) {
  const icons = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`,
    orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h16l-1 12H5L4 8z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>`,
    track: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="7" width="13" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-9.3-8.7C1.2 8 2.6 5 5.8 5c1.8 0 3.2 1 4.2 2.4C11 6 12.4 5 14.2 5c3.2 0 4.6 3 3.1 6.3C19 15.6 12 20 12 20z"/></svg>`,
    payout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  };
  return icons[name] || "";
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}