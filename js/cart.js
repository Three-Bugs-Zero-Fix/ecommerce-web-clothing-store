/* ============================================================
   Handles shopping cart logic using localStorage and Firebase.
   ============================================================ */

// Initialize cart array from localStorage, or empty array if null
let cart = JSON.parse(localStorage.getItem("blueWearCart")) || [];

// ========================================
// ADD TO CART (With Color and Size support)
// ========================================
function addToCart(id, name, price, image = "", color = "", size = "") {
    const existingItem = cart.find(item => item.id === id && item.color === color && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: Number(price),
            image: image,
            color: color,
            size: size,
            quantity: 1
        });
    }

    saveCart();
    alert("Added to cart successfully!");
}

// ========================================
// UPDATE QUANTITY BY INDEX
// ========================================
function updateQuantity(index, action) {
    const item = cart[index];
    
    if (item) {
        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                return;
            }
        }

        saveCart();
        renderCartPage();
    }
}

// ========================================
// UPDATE ITEM OPTION BY INDEX (Color or Size change)
// ========================================
function updateItemOption(index, field, newValue) {
    if (cart[index]) {
        cart[index][field] = newValue;
        saveCart();

        const duplicateIndex = cart.findIndex((item, idx) => 
            idx !== index && 
            item.id === cart[index].id && 
            item.color === cart[index].color && 
            item.size === cart[index].size
        );
        
        if (duplicateIndex > -1) {
            cart[duplicateIndex].quantity += cart[index].quantity;
            cart.splice(index, 1);
            saveCart();
        }

        renderCartPage();
    }
}

// ========================================
// REMOVE ITEM BY INDEX
// ========================================
function removeItem(index) {
    if (confirm("Are you sure you want to remove this item from your cart?")) {
        cart.splice(index, 1);
        saveCart();
        renderCartPage();
    }
}

// ========================================
// SAVE TO LOCAL STORAGE
// ========================================
function saveCart() {
    localStorage.setItem("blueWearCart", JSON.stringify(cart));
    updateCartIconCount();
}

// ========================================
// UPDATE NAVBAR ICON
// ========================================
function updateCartIconCount() {
    const navCartCount = document.getElementById("nav-cart-count");
    
    if (navCartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        navCartCount.textContent = totalItems;
    }
}

// ========================================
// RENDER CART PAGE UI (Responsive Clean Structure)
// ========================================
async function renderCartPage() {
    const container = document.getElementById("cart-items-container");
    const subtotalEl = document.getElementById("summary-subtotal");
    const totalEl = document.getElementById("summary-total");

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Your cart is currently empty. <a href="shop.html" style="color:#1769aa; font-weight:bold; text-decoration: none;">Continue shopping</a>.</p>`;
        subtotalEl.textContent = "৳0";
        totalEl.textContent = "৳0";
        return;
    }

    let subtotal = 0;
    container.innerHTML = `<p class="empty-cart-msg">Loading cart items...</p>`;

    let html = "";

    for (let index = 0; index < cart.length; index++) {
        const item = cart[index];
        subtotal += item.price * item.quantity;

        const imageHTML = item.image ? `<img src="${item.image}" alt="${item.name}">` : `IMAGE`;
        
        const isMinQty = item.quantity <= 1;
        const minusBtnStyle = isMinQty ? 'opacity: 0.4; cursor: pointer;' : '';

        let colors = [];
        let sizes = [];

        try {
            const productDoc = await db.collection("products").doc(item.id).get();
            if (productDoc.exists) {
                const prodData = productDoc.data();
                if (Array.isArray(prodData.colors)) {
                    colors = prodData.colors;
                } else if (typeof prodData.colors === 'string') {
                    colors = prodData.colors.split(',').map(c => c.trim());
                }

                if (Array.isArray(prodData.sizes)) {
                    sizes = prodData.sizes;
                } else if (typeof prodData.sizes === 'string') {
                    sizes = prodData.sizes.split(',').map(s => s.trim());
                }
            }
        } catch (err) {
            console.error("Error fetching product options from Firebase:", err);
        }

        if (colors.length === 0) colors = [item.color || "Standard"];
        if (sizes.length === 0) sizes = [item.size || "Free Size"];

        let colorOptionsHtml = colors.map(c => `<option value="${c}" ${item.color === c ? 'selected' : ''}>${c}</option>`).join('');
        let sizeOptionsHtml = sizes.map(s => `<option value="${s}" ${item.size === s ? 'selected' : ''}>${s}</option>`).join('');

        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-image">
                        ${imageHTML}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p style="font-weight: 600; color: #2563eb; margin-bottom: 8px;">৳${item.price.toLocaleString()}</p>
                        
                        <div class="cart-item-options">
                            <div>
                                <span class="option-label">Color:</span>
                                <select onchange="updateItemOption(${index}, 'color', this.value)" class="option-select">
                                    ${colorOptionsHtml}
                                </select>
                            </div>
                            <div>
                                <span class="option-label">Size:</span>
                                <select onchange="updateItemOption(${index}, 'size', this.value)" class="option-select">
                                    ${sizeOptionsHtml}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button onclick="updateQuantity(${index}, 'decrease')" style="${minusBtnStyle}">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="updateQuantity(${index}, 'increase')">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    subtotalEl.textContent = `৳${subtotal.toLocaleString()}`;
    totalEl.textContent = `৳${subtotal.toLocaleString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartIconCount();
    renderCartPage();
});