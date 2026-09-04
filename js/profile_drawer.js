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
  wireEvents(user);
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
      <p>Sign in to view your profile and order history.</p>
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

    <div class="drawer-section">
      <label>Order history</label>
      <div id="order-history">Loading orders…</div>
    </div>

    <button id="drawer-logout" class="logout-btn">Log out</button>
  `;
}

function wireEvents(user) {
  document.getElementById("drawer-logout").addEventListener("click", async () => {
    await logoutUser();
    closeDrawer();
  });

  loadOrders(user);
}

async function loadOrders(user) {
  const box = document.getElementById("order-history");
  try {
    const snap = await db.collection("orders")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      box.innerHTML = `<p class="no-orders">No orders yet.</p>`;
      return;
    }
    box.innerHTML = snap.docs.map(d => {
      const o = d.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : "";
      return `
        <div class="order-row">
          <div class="order-row-top">
            <span class="order-id">#${d.id.slice(0,6)}</span>
            <span class="order-status status-${(o.status||'pending').toLowerCase()}">${o.status || "Pending"}</span>
          </div>
          <div class="order-row-bottom">
            <span>${date}</span>
            <span class="order-total">৳${o.total || 0}</span>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    box.innerHTML = `<p class="no-orders">Couldn't load orders yet.</p>`;
  }
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}