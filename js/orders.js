let allOrders = [];
let currentSort = "date-desc";

/* ---------- ADMIN GUARD ---------- */
requireAdmin("login.html").then(async (user) => {
  document.getElementById("admin-loading").style.display = "none";
  document.getElementById("admin-shell").style.display = "flex";

  const name = (user.email || "Admin").split("@")[0];
  document.getElementById("sidebar-name").textContent = name;
  document.getElementById("sidebar-email").textContent = user.email;
  const initial = name.charAt(0).toUpperCase();
  document.getElementById("sidebar-avatar").textContent = initial;
  document.getElementById("topbar-avatar").textContent = initial;
  
  document.getElementById("popup-name").textContent = name;
  document.getElementById("popup-email").textContent = user.email;
  document.getElementById("popup-avatar").textContent = initial;

  await loadOrders();
});

/* ---------- SIDEBAR TOGGLE ---------- */
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  document.getElementById("dt-sidebar").classList.toggle("collapsed");
  document.getElementById("dt-main").classList.toggle("sidebar-collapsed");
  document.getElementById("dt-topbar").classList.toggle("sidebar-collapsed");
});

/* ---------- PROFILE POPUP ---------- */
const profileTrigger = document.getElementById("profile-trigger");
const profilePopup = document.getElementById("profile-popup");

if (profileTrigger && profilePopup) {
  profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePopup.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!profilePopup.contains(e.target) && !profileTrigger.contains(e.target)) {
      profilePopup.classList.remove("open");
    }
  });
}

document.getElementById("popup-logout")?.addEventListener("click", async () => {
  if (typeof logoutUser === "function") await logoutUser();
  window.location.href = "login.html";
});

/* ---------- CHECKBOX & BULK UI LOGIC ---------- */
function updateBulkUI() {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  const bulkWrap = document.getElementById('bulk-action-wrap');
  const bulkCount = document.getElementById('bulk-count');
  
  if(checkedBoxes.length > 0) {
      bulkWrap.style.display = 'inline-block';
      bulkCount.textContent = checkedBoxes.length;
  } else {
      bulkWrap.style.display = 'none';
  }
}

document.getElementById("select-all").addEventListener("change", function(e) {
  const checkboxes = document.querySelectorAll(".order-checkbox");
  checkboxes.forEach(cb => cb.checked = e.target.checked);
  updateBulkUI();
});

/* ---------- BULK ACTION EXECUTION ---------- */
const btnBulkActions = document.getElementById("btn-bulk-actions");
const bulkDropdownMenu = document.getElementById("bulk-dropdown-menu");

if(btnBulkActions && bulkDropdownMenu) {
  btnBulkActions.addEventListener("click", (e) => {
    e.stopPropagation();
    bulkDropdownMenu.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!btnBulkActions.contains(e.target) && !bulkDropdownMenu.contains(e.target)) {
      bulkDropdownMenu.classList.remove("show");
    }
  });
}

async function executeBulkAction(action, value) {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  if(checkedBoxes.length === 0) return;

  const ids = Array.from(checkedBoxes).map(cb => cb.value);
  
  try {
    if (action === 'status') {
      const promises = ids.map(id => db.collection("orders").doc(id).update({ status: value }));
      await Promise.all(promises);
      
      ids.forEach(id => {
        const orderIndex = allOrders.findIndex(order => order.id === id);
        if (orderIndex !== -1) allOrders[orderIndex].status = value;
      });
      
    } else if (action === 'delete') {
      if(!confirm(`Are you sure you want to delete ${ids.length} orders?`)) return;
      
      const promises = ids.map(id => db.collection("orders").doc(id).delete());
      await Promise.all(promises);
      
      allOrders = allOrders.filter(order => !ids.includes(order.id));
    }

    document.getElementById("select-all").checked = false;
    bulkDropdownMenu.classList.remove("show");
    updateOverviewStats();
    applyFilterAndSearch();
    updateBulkUI();
    
    alert("Bulk action applied successfully!");
  } catch (error) {
    console.error("Bulk Action Error:", error);
    alert("Failed to apply bulk action.");
  }
}

/* ---------- FULLSCREEN LOGIC FOR OVERVIEW CARD ---------- */
const overviewCard = document.getElementById("overview-card");
const btnFullscreen = document.getElementById("btn-fullscreen");
const btnMinimize = document.getElementById("btn-minimize");
const btnCloseFs = document.getElementById("btn-close-fs");
const timeFilter = document.getElementById("overview-time-filter");

function openFullscreen(e) {
  if (e) e.stopPropagation();
  overviewCard.classList.add("is-fullscreen");
  btnFullscreen.style.display = "none";
  btnMinimize.style.display = "flex";
  btnCloseFs.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeFullscreen(e) {
  if (e) e.stopPropagation();
  overviewCard.classList.remove("is-fullscreen");
  btnFullscreen.style.display = "flex";
  btnMinimize.style.display = "none";
  btnCloseFs.style.display = "none";
  document.body.style.overflow = "";
}

btnFullscreen.addEventListener("click", openFullscreen);
btnMinimize.addEventListener("click", closeFullscreen);
btnCloseFs.addEventListener("click", closeFullscreen);
timeFilter.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overviewCard.classList.contains("is-fullscreen")) {
    closeFullscreen();
  }
});

/* ---------- HELPER: GET TIMESTAMP ---------- */
function getTimestamp(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  return 0;
}

/* ---------- LOAD ORDERS & UPDATE STATS ---------- */
async function loadOrders() {
  try {
    const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
    allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    updateOverviewStats();
    applyFilterAndSearch();
  } catch (error) {
    document.getElementById("orders-body").innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Failed to load orders: ${error.message}</td></tr>`;
  }
}

timeFilter.addEventListener("change", updateOverviewStats);

function updateOverviewStats() {
  const filterValue = timeFilter.value;
  const now = new Date().getTime();
  let timeLimit = 0;

  if (filterValue === "day") timeLimit = 24 * 60 * 60 * 1000;
  else if (filterValue === "week") timeLimit = 7 * 24 * 60 * 60 * 1000;
  else if (filterValue === "month") timeLimit = 30 * 24 * 60 * 60 * 1000;
  else if (filterValue === "year") timeLimit = 365 * 24 * 60 * 60 * 1000;

  const filteredOrders = allOrders.filter(order => {
    const orderTime = getTimestamp(order.createdAt);
    return (now - orderTime) <= timeLimit;
  });

  const total = filteredOrders.length;
  const pendingCount = filteredOrders.filter(o => (o.status || 'pending') === 'pending').length;
  const processingCount = filteredOrders.filter(o => o.status === 'processing').length;
  const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pendingCount;
  document.getElementById('stat-processing').textContent = processingCount;
  document.getElementById('stat-delivered').textContent = deliveredCount;

  if (total > 0) {
    document.getElementById('bar-pending').style.width = `${(pendingCount / total) * 100}%`;
    document.getElementById('bar-processing').style.width = `${(processingCount / total) * 100}%`;
    document.getElementById('bar-delivered').style.width = `${(deliveredCount / total) * 100}%`;
  } else {
    document.getElementById('bar-pending').style.width = '0%';
    document.getElementById('bar-processing').style.width = '0%';
    document.getElementById('bar-delivered').style.width = '0%';
  }
}

/* ---------- TOGGLE FILTER DROPDOWN ---------- */
const btnToggleFilters = document.getElementById("btn-toggle-filters");
const filterDropdownMenu = document.getElementById("filter-dropdown-menu");

if (btnToggleFilters && filterDropdownMenu) {
  btnToggleFilters.addEventListener("click", (e) => {
    e.stopPropagation();
    filterDropdownMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!btnToggleFilters.contains(e.target) && !filterDropdownMenu.contains(e.target)) {
      filterDropdownMenu.classList.remove("show");
    }
  });

  const filterItems = document.querySelectorAll(".filter-item");
  filterItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      filterItems.forEach(i => i.classList.remove("active"));
      e.currentTarget.classList.add("active");
      
      currentSort = e.currentTarget.getAttribute("data-sort");
      filterDropdownMenu.classList.remove("show");
      
      applyFilterAndSearch();
    });
  });
}

/* ---------- TABS CLICK LOGIC ---------- */
const tabs = document.querySelectorAll(".dt-tab-btn");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    applyFilterAndSearch();
  });
});

/* ---------- SEARCH & FILTERS LOGIC ---------- */
function applyFilterAndSearch() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  
  const activeTab = document.querySelector(".dt-tab-btn.active");
  const statusVal = activeTab ? activeTab.getAttribute("data-status") : "";

  let filteredList = allOrders.filter(order => {
    const matchQuery = (order.id || "").toLowerCase().includes(query) ||
                       (order.customerName || "").toLowerCase().includes(query) ||
                       (order.phone || "").toLowerCase().includes(query);
    
    let matchStatus = true;
    if (statusVal) {
      matchStatus = (order.status || "pending") === statusVal;
    }
    
    return matchQuery && matchStatus;
  });

  if (currentSort === "date-desc") {
    filteredList.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
  } else if (currentSort === "date-asc") {
    filteredList.sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));
  } else if (currentSort === "price-desc") {
    filteredList.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
  } else if (currentSort === "price-asc") {
    filteredList.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
  }

  renderTable(filteredList);
}

document.getElementById("search-input")?.addEventListener("input", applyFilterAndSearch);

/* ---------- SINGLE UPDATE ORDER STATUS & DELIVERY BOY ---------- */
async function updateOrderStatus(id, newStatus) {
  try {
    await db.collection("orders").doc(id).update({ status: newStatus });
    const orderIndex = allOrders.findIndex(order => order.id === id);
    if (orderIndex !== -1) allOrders[orderIndex].status = newStatus;
    updateOverviewStats();
    applyFilterAndSearch();
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status.");
  }
}

async function updateDeliveryBoy(id, boyName) {
  try {
    await db.collection("orders").doc(id).update({ deliveryBoy: boyName });
    const orderIndex = allOrders.findIndex(order => order.id === id);
    if (orderIndex !== -1) allOrders[orderIndex].deliveryBoy = boyName;
    applyFilterAndSearch();
  } catch (error) {
    console.error("Error assigning delivery boy:", error);
    alert("Failed to assign delivery boy.");
  }
}

/* ---------- SINGLE DELETE ORDER ---------- */
async function deleteOrder(id) {
  if (confirm("Are you sure you want to delete this order?")) {
    try {
      await db.collection("orders").doc(id).delete();
      allOrders = allOrders.filter(order => order.id !== id);
      updateOverviewStats();
      applyFilterAndSearch();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  }
}

/* ---------- RENDER TABLE ---------- */
function renderTable(list) {
  const body = document.getElementById("orders-body");
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#9ca3af; padding:30px;">No orders found matching your criteria.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(order => {
    const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
    const assignedRider = order.deliveryBoy ? `<span style="color: #0284c7; font-weight: 500;">${escapeHtml(order.deliveryBoy)}</span>` : `<span style="color: #9ca3af; font-style: italic;">Unassigned</span>`;
    
    let statusClass = "status-pending";
    if (order.status === "processing") statusClass = "status-processing";
    if (order.status === "delivered") statusClass = "status-delivered";
    if (order.status === "canceled") statusClass = "status-canceled";
    if (order.status === "returned") statusClass = "status-returned";

    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 15px 12px; text-align: center;">
          <input type="checkbox" class="order-checkbox" value="${order.id}" onchange="updateBulkUI()">
        </td>
        <td style="padding: 15px 12px; font-weight: 500; color: #374151;">#${order.id.slice(0, 8)}</td>
        <td style="padding: 15px 12px;">
          <div style="font-weight: 600; color: #111827;">${escapeHtml(order.customerName)}</div>
          <div style="font-size: 12px; color: #6b7280;">${escapeHtml(order.phone)}</div>
        </td>
        <td style="padding: 15px 12px; color: #4b5563;">${assignedRider}</td>
        <td style="padding: 15px 12px; color: #4b5563;">${date}</td>
        <td style="padding: 15px 12px; font-weight: 600;">৳${order.totalAmount?.toLocaleString() || 0}</td>
        <td style="padding: 15px 12px;">
          <span class="dt-status-pill ${statusClass}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize;">
            ${escapeHtml(order.status || 'Pending')}
          </span>
        </td>
        <td style="padding: 15px 12px; text-align: center;">
          <button onclick="openOrderModal('${order.id}')" title="View Order" style="background:none; border:none; color:#6b7280; cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </td>
        <td style="padding: 15px 12px; text-align: center;">
          <button onclick="deleteOrder('${order.id}')" title="Delete Order" style="background:none; border:none; color:#ef4444; cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  updateBulkUI();
}

/* ---------- FULL INFO MODAL LOGIC ---------- */
const orderModal = document.getElementById("order-modal-overlay");

function openOrderModal(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;

  const date = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
  
  let itemsListHtml = '<div style="margin: 15px 0; border: 1px solid #e5e7eb; border-radius: 8px;">';
  if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
          itemsListHtml += `
              <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e5e7eb;">
                  <img src="${item.image || ''}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 12px; background: #f9fafb;">
                  <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 13px; color: #111827;">${escapeHtml(item.name)}</div>
                      <div style="font-size: 12px; color: #6b7280;">Qty: ${item.quantity}</div>
                  </div>
                  <div style="font-weight: 600; font-size: 13px; color: #111827;">৳${(item.price * item.quantity).toLocaleString()}</div>
              </div>
          `;
      });
  } else {
      itemsListHtml += `<div style="padding: 10px; font-size: 13px; color: #6b7280;">No items found.</div>`;
  }
  itemsListHtml += '</div>';

  document.getElementById("order-modal-content").innerHTML = `
    <div class="order-detail-row"><span class="order-label">Order ID:</span> <span class="order-value">#${order.id}</span></div>
    <div class="order-detail-row"><span class="order-label">Customer Name:</span> <span class="order-value">${escapeHtml(order.customerName)}</span></div>
    <div class="order-detail-row"><span class="order-label">Phone:</span> <span class="order-value">${escapeHtml(order.phone)}</span></div>
    <div class="order-detail-row"><span class="order-label">Payment Method:</span> <span class="order-value" style="text-transform: capitalize;">${escapeHtml(order.paymentMethod)}</span></div>
    <div class="order-detail-row"><span class="order-label">Delivery Address:</span> <span class="order-value" style="max-width: 60%; text-align: right;">${escapeHtml(order.address)}, ${escapeHtml(order.city)} - ${escapeHtml(order.zip)}</span></div>
    <div class="order-detail-row"><span class="order-label">Date:</span> <span class="order-value">${date}</span></div>
    
    <div style="display: flex; gap: 12px; margin-top: 15px;">
      <div class="order-detail-row" style="flex: 1; flex-direction: column; align-items: flex-start; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <span class="order-label" style="color: #334155; font-weight: 600; margin-bottom: 6px;">Update Status:</span> 
        <select onchange="updateOrderStatus('${order.id}', this.value)" style="width: 100%; padding: 6px; font-weight: 600; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; cursor: pointer;">
            <option value="pending" ${(!order.status || order.status === 'pending') ? 'selected' : ''}>Pending</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>On Delivery</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Canceled</option>
            <option value="returned" ${order.status === 'returned' ? 'selected' : ''}>Returned</option>
        </select>
      </div>
      
      <div class="order-detail-row" style="flex: 1; flex-direction: column; align-items: flex-start; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <span class="order-label" style="color: #334151; font-weight: 600; margin-bottom: 6px;">Assign Rider:</span> 
        <select onchange="updateDeliveryBoy('${order.id}', this.value)" style="width: 100%; padding: 6px; font-weight: 600; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; cursor: pointer;">
            <option value="">-- Select Rider --</option>
            <option value="Rana Das" ${order.deliveryBoy === 'Rana Das' ? 'selected' : ''}>Rana Das</option>
            <option value="Tohin Ahmed" ${order.deliveryBoy === 'Tohin Ahmed' ? 'selected' : ''}>Tohin Ahmed</option>
            <option value="Biplop Kumar" ${order.deliveryBoy === 'Biplop Kumar' ? 'selected' : ''}>Biplop Kumar</option>
            <option value="Raju" ${order.deliveryBoy === 'Raju' ? 'selected' : ''}>Raju</option>
            <option value="Dipto Saha" ${order.deliveryBoy === 'Dipto Saha' ? 'selected' : ''}>Dipto Saha</option>
            <option value="Akas" ${order.deliveryBoy === 'Akas' ? 'selected' : ''}>Akas</option>
        </select>
      </div>
    </div>

    <h4 style="margin-top: 20px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Ordered Items</h4>
    ${itemsListHtml}

    <div style="margin-top: 15px; padding-top: 10px;">
      <div class="order-detail-row" style="border:none; padding: 5px 0;"><span class="order-label">Subtotal:</span> <span class="order-value">৳${order.subtotal?.toLocaleString() || 0}</span></div>
      <div class="order-detail-row" style="border:none; padding: 5px 0;"><span class="order-label">Shipping:</span> <span class="order-value">৳${order.shippingFee}</span></div>
      <div class="order-detail-row" style="border:none; padding: 12px; margin-top: 10px; background: #f9fafb; border-radius: 8px;">
        <span class="order-label" style="color: #111827;">Total Amount:</span> 
        <span class="order-value" style="font-size: 16px; color: #059669;">৳${order.totalAmount?.toLocaleString() || 0}</span>
      </div>
    </div>
  `;

  orderModal.classList.add("open");
}

document.getElementById("order-modal-close").addEventListener("click", () => orderModal.classList.remove("open"));
document.getElementById("order-modal-ok-btn").addEventListener("click", () => orderModal.classList.remove("open"));

/* ---------- HTML ESCAPE ---------- */
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}