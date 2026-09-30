let allOrders = [];
let currentStatusFilter = "";
let currentLimitFilter = 0;
let currentMethodFilter = "";

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

/* ---------- CHECKBOX & TOP COUNTS ---------- */
function updateTopCounts() {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  const count = checkedBoxes.length;
  
  document.getElementById('top-bulk-count').textContent = count;
  document.getElementById('top-assign-count').textContent = count;
  document.getElementById('top-unassign-count').textContent = count;
}

document.getElementById("select-all").addEventListener("change", function(e) {
  const checkboxes = document.querySelectorAll(".order-checkbox");
  checkboxes.forEach(cb => cb.checked = e.target.checked);
  updateTopCounts();
});

/* ---------- FILTER DROPDOWN TOGGLES ---------- */
const btnBulk = document.getElementById("btn-top-bulk");
const menuBulk = document.getElementById("top-bulk-menu");
const btnAssign = document.getElementById("btn-top-assign");
const menuAssign = document.getElementById("top-assign-menu");
const btnViewToggle = document.getElementById("btn-view-toggle");
const viewDropdownMenu = document.getElementById("view-dropdown-menu");

if (btnBulk && menuBulk) {
  btnBulk.addEventListener("click", (e) => {
    e.stopPropagation();
    menuBulk.style.display = menuBulk.style.display === "block" ? "none" : "block";
    closeAllPopups('top-bulk-menu');
  });
}

if (btnAssign && menuAssign) {
  btnAssign.addEventListener("click", (e) => {
    e.stopPropagation();
    menuAssign.style.display = menuAssign.style.display === "block" ? "none" : "block";
    closeAllPopups('top-assign-menu');
  });
}

if (btnViewToggle && viewDropdownMenu) {
  btnViewToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    viewDropdownMenu.style.display = viewDropdownMenu.style.display === "block" ? "none" : "block";
    closeAllPopups('view-dropdown-menu');
  });
}

function toggleFilterMenu(event, menuId) {
  event.stopPropagation();
  const menu = document.getElementById(menuId);
  const isVisible = menu.style.display === "block";
  closeAllPopups();
  menu.style.display = isVisible ? "none" : "block";
}

function toggleThDropdown(event, dropdownId) {
  event.stopPropagation();
  const dropdown = document.getElementById(dropdownId);
  const isVisible = dropdown.style.display === "block";
  
  document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
    d.style.display = 'none';
  });
  closeAllPopups(dropdownId);

  dropdown.style.display = isVisible ? "none" : "block";
}

function closeAllPopups(except = '') {
  if(except !== 'top-bulk-menu' && menuBulk) menuBulk.style.display = "none";
  if(except !== 'top-assign-menu' && menuAssign) menuAssign.style.display = "none";
  if(except !== 'view-dropdown-menu' && viewDropdownMenu) viewDropdownMenu.style.display = "none";
  
  document.querySelectorAll('.filter-pop-menu').forEach(m => {
    if(m.id !== except) m.style.display = 'none';
  });
}

document.addEventListener("click", () => {
  closeAllPopups();
  document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
    d.style.display = 'none';
  });
});

/* ---------- FILTER LOGIC & RESET BUTTON ---------- */
function selectStatusFilter(status) {
  currentStatusFilter = status;
  const badge = document.getElementById("badge-status");
  if (status) {
    badge.textContent = status;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
  closeAllPopups();
  applyAllFilters();
}

function selectLimitFilter(days) {
  currentLimitFilter = days;
  const badge = document.getElementById("badge-limits");
  if (days > 0) {
    badge.textContent = `${days} Days`;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
  closeAllPopups();
  applyAllFilters();
}

function selectMethodFilter(method) {
  currentMethodFilter = method;
  const badge = document.getElementById("badge-method");
  if (method) {
    badge.textContent = method;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
  closeAllPopups();
  applyAllFilters();
}

function applyAllFilters() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  const startDate = document.getElementById("filter-start-date").value;
  const endDate = document.getElementById("filter-end-date").value;

  const now = new Date().getTime();

  let filtered = allOrders.filter(order => {
    const matchSearch = (order.customerName || "").toLowerCase().includes(query) ||
                        (order.id || "").toLowerCase().includes(query) ||
                        (order.phone || "").toLowerCase().includes(query);
    
    let matchStatus = true;
    if (currentStatusFilter) {
      const orderStatus = (order.status || "").toLowerCase();
      matchStatus = orderStatus.includes(currentStatusFilter.toLowerCase());
    }

    let matchMethod = true;
    if (currentMethodFilter) {
      matchMethod = (order.paymentMethod || "").toLowerCase() === currentMethodFilter.toLowerCase();
    }

    let matchLimit = true;
    if (currentLimitFilter > 0 && order.createdAt) {
      const orderTime = order.createdAt.toMillis();
      const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
      matchLimit = diffDays <= currentLimitFilter;
    }

    let matchDate = true;
    if (startDate && order.createdAt) {
      const start = new Date(startDate).setHours(0,0,0,0);
      matchDate = matchDate && order.createdAt.toMillis() >= start;
    }
    if (endDate && order.createdAt) {
      const end = new Date(endDate).setHours(23,59,59,999);
      matchDate = matchDate && order.createdAt.toMillis() <= end;
    }

    return matchSearch && matchStatus && matchMethod && matchLimit && matchDate;
  });

  const hasActiveFilter = currentStatusFilter || currentLimitFilter > 0 || currentMethodFilter || startDate || endDate || query;
  const resetBtn = document.getElementById("btn-reset-filters");
  if (resetBtn) {
    resetBtn.style.display = hasActiveFilter ? "inline-flex" : "none";
  }

  renderTable(filtered);
}

function resetAllFilters() {
  currentStatusFilter = "";
  currentLimitFilter = 0;
  currentMethodFilter = "";
  document.getElementById("search-input").value = "";
  document.getElementById("filter-start-date").value = "";
  document.getElementById("filter-end-date").value = "";

  document.getElementById("badge-status").style.display = "none";
  document.getElementById("badge-limits").style.display = "none";
  document.getElementById("badge-method").style.display = "none";
  document.getElementById("btn-reset-filters").style.display = "none";

  renderTable(allOrders);
}

document.getElementById("search-input")?.addEventListener("input", applyAllFilters);

/* ---------- COLUMN HIDE/SHOW & SORTING ---------- */
function hideColumn(className) {
  document.querySelectorAll('.' + className).forEach(el => el.style.display = 'none');
  const checkbox = document.querySelector(`.col-toggle[data-col="${className}"]`);
  if(checkbox) checkbox.checked = false;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".col-toggle").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const colClass = e.target.getAttribute("data-col");
      const isChecked = e.target.checked;
      document.querySelectorAll('.' + colClass).forEach(el => {
        el.style.display = isChecked ? '' : 'none';
      });
    });
  });

  const downloadBtn = document.getElementById("btn-download-all");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadAllOrdersCSV);
  }
});

function getOrderQuantity(order) {
  let qty = 0;
  if (order.items && order.items.length > 0) {
    order.items.forEach(i => { qty += (i.quantity || 1); });
  } else {
    qty = 1;
  }
  return qty;
}

function capitalizeStatus(status) {
  if (!status) return 'Pending';
  return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function sortOrders(field, direction) {
  allOrders.sort((a, b) => {
    let valA = '', valB = '';
    if (field === 'invoice') { valA = a.id || ''; valB = b.id || ''; }
    else if (field === 'time') { valA = a.createdAt ? a.createdAt.toMillis() : 0; valB = b.createdAt ? b.createdAt.toMillis() : 0; }
    else if (field === 'customer') { valA = a.customerName || ''; valB = b.customerName || ''; }
    else if (field === 'method') { valA = a.paymentMethod || ''; valB = b.paymentMethod || ''; }
    else if (field === 'amount') { valA = a.totalAmount || 0; valB = b.totalAmount || 0; }
    else if (field === 'quantity') { valA = getOrderQuantity(a); valB = getOrderQuantity(b); }
    else if (field === 'status') { valA = a.status || ''; valB = b.status || ''; }
    else if (field === 'delivery') { valA = a.deliveryBoy || ''; valB = b.deliveryBoy || ''; }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  applyAllFilters();
}

/* ---------- LOAD ORDERS ---------- */
async function loadOrders() {
  try {
    const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
    allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable(allOrders);
  } catch (error) {
    document.getElementById("orders-body").innerHTML = `<tr><td colspan="11" style="text-align:center; color:red;">Failed to load orders: ${error.message}</td></tr>`;
  }
}

/* ---------- SINGLE & BULK ACTIONS ---------- */
async function updateOrderStatus(id, newStatus) {
  try {
    await db.collection("orders").doc(id).update({ status: newStatus });
    const idx = allOrders.findIndex(o => o.id === id);
    if (idx !== -1) allOrders[idx].status = newStatus;
    applyAllFilters();
  } catch (error) {
    console.error("Error updating status:", error);
  }
}

async function updateDeliveryBoy(id, boyName) {
  try {
    await db.collection("orders").doc(id).update({ deliveryBoy: boyName });
    const idx = allOrders.findIndex(o => o.id === id);
    if (idx !== -1) allOrders[idx].deliveryBoy = boyName;
    applyAllFilters();
  } catch (error) {
    console.error("Error assigning rider:", error);
  }
}

async function executeBulkStatus(status) {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  if (checkedBoxes.length === 0) { alert("Please select at least one order."); return; }
  try {
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    await Promise.all(ids.map(id => db.collection("orders").doc(id).update({ status: status })));
    ids.forEach(id => {
      const idx = allOrders.findIndex(o => o.id === id);
      if (idx !== -1) allOrders[idx].status = status;
    });
    document.getElementById("select-all").checked = false;
    applyAllFilters();
    alert("Status updated successfully!");
  } catch (error) { console.error(error); }
}

async function executeBulkAssign(riderName) {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  if (checkedBoxes.length === 0) { alert("Please select at least one order."); return; }
  try {
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    await Promise.all(ids.map(id => db.collection("orders").doc(id).update({ deliveryBoy: riderName })));
    ids.forEach(id => {
      const idx = allOrders.findIndex(o => o.id === id);
      if (idx !== -1) allOrders[idx].deliveryBoy = riderName;
    });
    document.getElementById("select-all").checked = false;
    applyAllFilters();
    alert(`Rider ${riderName} assigned successfully!`);
  } catch (error) { console.error(error); }
}

async function executeBulkUnassign() {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  if (checkedBoxes.length === 0) { alert("Please select at least one order."); return; }
  try {
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    await Promise.all(ids.map(id => db.collection("orders").doc(id).update({ deliveryBoy: "" })));
    ids.forEach(id => {
      const idx = allOrders.findIndex(o => o.id === id);
      if (idx !== -1) allOrders[idx].deliveryBoy = "";
    });
    document.getElementById("select-all").checked = false;
    applyAllFilters();
    alert("Selected orders unassigned successfully!");
  } catch (error) { console.error(error); }
}

async function deleteSelectedOrders() {
  const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
  if (checkedBoxes.length === 0) { alert("Please select at least one order to delete."); return; }
  if (confirm(`Are you sure you want to delete ${checkedBoxes.length} orders?`)) {
    try {
      const ids = Array.from(checkedBoxes).map(cb => cb.value);
      await Promise.all(ids.map(id => db.collection("orders").doc(id).delete()));
      allOrders = allOrders.filter(o => !ids.includes(o.id));
      document.getElementById("select-all").checked = false;
      applyAllFilters();
      alert("Deleted successfully!");
    } catch (error) { console.error(error); }
  }
}

/* ---------- DOWNLOAD ALL ORDERS AS CSV ---------- */
function downloadAllOrdersCSV() {
  if (!allOrders || allOrders.length === 0) { 
    alert("No orders available to export."); 
    return; 
  }

  let csvContent = "Invoice ID,Order Time,Customer Name,Phone,Method,Amount,Quantity,Status,Delivery\n";

  allOrders.forEach(o => {
    const dateStr = o.createdAt ? o.createdAt.toDate().toLocaleString().replace(/,/g, '') : '';
    const invoiceId = `#${(o.id || '').slice(0, 6)}`;
    const customer = `"${(o.customerName || '').replace(/"/g, '""')}"`;
    const phone = `"${(o.phone || '').replace(/"/g, '""')}"`;
    const method = (o.paymentMethod || 'COD').toUpperCase();
    const amount = o.totalAmount || 0;
    const qty = getOrderQuantity(o);
    const status = capitalizeStatus(o.status);
    const delivery = `"${(o.deliveryBoy || 'Unassign').replace(/"/g, '""')}"`;

    csvContent += `${invoiceId},"${dateStr}",${customer},${phone},${method},${amount},${qty},${status},${delivery}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "bluewear_orders_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ---------- PRINT RECEIPT AS BLUEWEAR STYLE ---------- */
function printOrderInvoice(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;

  const dateStr = order.createdAt ? order.createdAt.toDate().toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'}) : '09/30/2026';
  let itemsRows = '';
  let totalQty = 0;

  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      totalQty += (item.quantity || 1);
      itemsRows += `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${escapeHtml(item.name)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right;">৳${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
        </tr>
      `;
    });
  } else {
    itemsRows = `<tr><td colspan="3" style="padding: 10px 0; text-align: center;">No items found</td></tr>`;
  }

  const container = document.getElementById("print-receipt-container");
  container.innerHTML = `
    <div style="max-width: 500px; margin: 20px auto; background: #ffffff; padding: 20px; font-family: 'Inter', sans-serif; color: #111827;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-weight: 700; font-size: 18px;">BlueWear</div>
        <p style="margin: 2px 0; font-size: 11px; color: #374151;">House 12, Road 5, Banani, Dhaka</p>
        <p style="margin: 0; font-size: 11px; color: #374151;">(+880) 1234-567890</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">alawol@gmail.com</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <thead>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 6px 0; font-size: 12px; text-align: left;">Item</th>
            <th style="padding: 6px 0; font-size: 12px; text-align: center;">Qty</th>
            <th style="padding: 6px 0; font-size: 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #111827; margin-bottom: 15px;">
        <div>
          <p style="margin: 2px 0;"><strong>Paymentmethod :</strong> ${escapeHtml(order.paymentMethod || 'Cash')}</p>
          <p style="margin: 2px 0;"><strong>Shipping Method :</strong> UPS</p>
          <p style="margin: 2px 0;"><strong>No of Items :</strong> ${totalQty}</p>
          <p style="margin: 2px 0;"><strong>Bill No :</strong> ${order.id.slice(0, 6)}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 2px 0;"><strong>Gross Total :</strong> ৳${(order.subtotal || order.totalAmount || 0).toLocaleString()}</p>
          <p style="margin: 2px 0;"><strong>Shipping Cost :</strong> ৳${(order.shippingFee || 60).toLocaleString()}</p>
          <hr style="border: none; border-top: 1px solid #111827; margin: 4px 0;" />
          <p style="margin: 2px 0; font-size: 14px; font-weight: 700;">Total : ৳${(order.totalAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      <div style="font-size: 11px; color: #374151; border-top: 1px dashed #e5e7eb; padding-top: 8px;">
        <p style="margin: 2px 0;">VAT number: <strong>47589</strong></p>
        <p style="margin: 2px 0;">Date : <strong>${dateStr}</strong></p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; font-weight: 600;">
        Thank you for your order. Come Again...!
      </div>
    </div>
  `;

  container.style.display = "block";
  window.print();
  container.style.display = "none";
}

/* ---------- RENDER TABLE ---------- */
function renderTable(list) {
  const body = document.getElementById("orders-body");
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="11" style="text-align:center; color:#9ca3af; padding:30px;">No orders found matching your criteria.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(order => {
    const timeStr = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
    const method = order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD';
    const assignedRider = order.deliveryBoy ? `<span style="color: #0284c7; font-weight: 500;">${escapeHtml(order.deliveryBoy)}</span>` : `<span style="color: #ef4444; font-size: 12px;">Unassign</span>`;
    
    const totalQuantity = getOrderQuantity(order);
    const orderStatusText = capitalizeStatus(order.status);
    const lowerStatus = orderStatusText.toLowerCase();

    let statusBg = "#fef3c7", statusColor = "#b45309";
    if (lowerStatus.includes("processing")) { statusBg = "#e0f2fe"; statusColor = "#0284c7"; }
    else if (lowerStatus.includes("delivered")) { statusBg = "#d1fae5"; statusColor = "#059669"; }
    else if (lowerStatus.includes("out for delivery")) { statusBg = "#ede9fe"; statusColor = "#7c3aed"; }
    else if (lowerStatus.includes("cancel")) { statusBg = "#fee2e2"; statusColor = "#b91c1c"; }

    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 15px 12px; text-align: center;">
          <input type="checkbox" class="order-checkbox" value="${order.id}" onchange="updateTopCounts()">
        </td>
        <td class="col-invoice" style="padding: 15px 12px; font-weight: 600; color: #2563eb;">#${order.id.slice(0, 6)}</td>
        <td class="col-time" style="padding: 15px 12px; color: #4b5563; font-size: 13px;">${timeStr}</td>
        <td class="col-customer" style="padding: 15px 12px;">
          <div style="font-weight: 600; color: #111827;">${escapeHtml(order.customerName)}</div>
          <div style="font-size: 12px; color: #6b7280;">${escapeHtml(order.phone)}</div>
        </td>
        <td class="col-method" style="padding: 15px 12px; font-weight: 500; color: #374151;">${method}</td>
        <td class="col-amount" style="padding: 15px 12px; font-weight: 600; color: #111827;">৳${order.totalAmount?.toLocaleString() || 0}</td>
        <td class="col-quantity" style="padding: 15px 12px; font-weight: 600; color: #374151; text-align: center;">${totalQuantity}</td>
        <td class="col-status" style="padding: 15px 12px;">
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            ${orderStatusText}
          </span>
        </td>
        <td class="col-delivery" style="padding: 15px 12px; font-size: 13px;">${assignedRider}</td>
        <td style="padding: 15px 12px;">
          <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 6px 10px; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; background: #fff; cursor: pointer;">
              <option value="Pending" ${lowerStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${lowerStatus === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="Out For Delivery" ${lowerStatus === 'out for delivery' ? 'selected' : ''}>Out For Delivery</option>
              <option value="Delivered" ${lowerStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancel" ${lowerStatus === 'cancel' ? 'selected' : ''}>Cancel</option>
          </select>
        </td>
        <td class="col-invoice-col" style="padding: 15px 12px; text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button onclick="printOrderInvoice('${order.id}')" title="Print Receipt" style="background:none; border:none; color:#6b7280; cursor:pointer;">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
            <button onclick="openOrderModal('${order.id}')" title="View Full Info" style="background:none; border:none; color:#6b7280; cursor:pointer;">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
  updateTopCounts();
}

/* ---------- FULL INFO MODAL ---------- */
const orderModal = document.getElementById("order-modal-overlay");

function openOrderModal(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;

  const date = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
  
  let itemsHtml = '<div style="margin: 15px 0; border: 1px solid #e5e7eb; border-radius: 8px;">';
  if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
          itemsHtml += `
              <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e5e7eb;">
                  <img src="${item.image || ''}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; margin-right: 12px; background: #f9fafb; border: 1px solid #e5e7eb;">
                  <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 13px; color: #111827;">${escapeHtml(item.name)}</div>
                      <div style="font-size: 12px; color: #6b7280;">Qty: ${item.quantity}</div>
                  </div>
                  <div style="font-weight: 600; font-size: 13px; color: #111827;">৳${(item.price * item.quantity).toLocaleString()}</div>
              </div>
          `;
      });
  } else {
      itemsHtml += `<div style="padding: 10px; font-size: 13px; color: #6b7280;">No items found.</div>`;
  }
  itemsHtml += '</div>';

  document.getElementById("order-modal-content").innerHTML = `
    <div class="order-detail-row"><span class="order-label">Order ID:</span> <span class="order-value">#${order.id}</span></div>
    <div class="order-detail-row"><span class="order-label">Customer Name:</span> <span class="order-value">${escapeHtml(order.customerName)}</span></div>
    <div class="order-detail-row"><span class="order-label">Phone:</span> <span class="order-value">${escapeHtml(order.phone)}</span></div>
    <div class="order-detail-row"><span class="order-label">Payment Method:</span> <span class="order-value" style="text-transform: uppercase;">${escapeHtml(order.paymentMethod)}</span></div>
    <div class="order-detail-row"><span class="order-label">Delivery Address:</span> <span class="order-value" style="max-width: 60%; text-align: right;">${escapeHtml(order.address || '')}, ${escapeHtml(order.city || '')} - ${escapeHtml(order.zip || '')}</span></div>
    <div class="order-detail-row"><span class="order-label">Date:</span> <span class="order-value">${date}</span></div>
    
    <div style="margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <span class="order-label" style="color: #334151; font-weight: 600; display: block; margin-bottom: 6px;">Assign Rider:</span> 
      <select onchange="updateDeliveryBoy('${order.id}', this.value)" style="width: 100%; padding: 6px; font-weight: 600; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; background: #fff;">
          <option value="">-- Select Rider --</option>
          <option value="Alex Thompson" ${order.deliveryBoy === 'Alex Thompson' ? 'selected' : ''}>Alex Thompson</option>
          <option value="Michael Chen" ${order.deliveryBoy === 'Michael Chen' ? 'selected' : ''}>Michael Chen</option>
          <option value="James Rodriguez" ${order.deliveryBoy === 'James Rodriguez' ? 'selected' : ''}>James Rodriguez</option>
          <option value="Rana Das" ${order.deliveryBoy === 'Rana Das' ? 'selected' : ''}>Rana Das</option>
      </select>
    </div>

    <h4 style="margin-top: 20px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Ordered Items</h4>
    ${itemsHtml}

    <div style="margin-top: 15px; padding-top: 10px;">
      <div class="order-detail-row" style="border:none; padding: 5px 0;"><span class="order-label">Subtotal:</span> <span class="order-value">৳${order.subtotal?.toLocaleString() || order.totalAmount?.toLocaleString() || 0}</span></div>
      <div class="order-detail-row" style="border:none; padding: 5px 0;"><span class="order-label">Shipping:</span> <span class="order-value">৳${order.shippingFee || 0}</span></div>
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

async function deleteOrder(id) {
  if (confirm("Are you sure you want to delete this order?")) {
    try {
      await db.collection("orders").doc(id).delete();
      allOrders = allOrders.filter(o => o.id !== id);
      applyAllFilters();
    } catch (error) { console.error(error); }
  }
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}