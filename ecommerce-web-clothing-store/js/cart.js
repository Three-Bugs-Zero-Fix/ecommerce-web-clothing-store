/* ============================================================
   Handles shopping cart logic using localStorage.
   ============================================================ */

// Initialize cart array from localStorage, or empty array if null
let cart = JSON.parse(localStorage.getItem("blueWearCart")) || [];

// ========================================
// ADD TO CART (For your friends to use)
// ========================================

function addToCart(id, name, price, image = "") {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        // If product already in cart, just increase quantity
        existingItem.quantity += 1;
    } else {
        // Add new product object to cart array
        cart.push({
            id: id,
            name: name,
            price: Number(price),
            image: image,
            quantity: 1
        });
    }

    saveCart();
    alert("Added to cart!");
}

// ========================================
// UPDATE QUANTITY
// ========================================
function updateQuantity(id, action) {
    const item = cart.find(item => item.id === id);
    
    if (item) {
        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
        }

        // If quantity drops to 0, remove the item
        if (item.quantity <= 0) {
            removeItem(id);
            return; // removeItem will handle saving and rendering
        }

        saveCart();
        renderCartPage();
    }
}

// ========================================
// REMOVE ITEM
// ========================================
function removeItem(id) {
    // Filter out the item with the given id
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCartPage();
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
        // Calculate total number of items
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        navCartCount.textContent = totalItems;
    }
}

// ========================================
// RENDER CART PAGE UI
// ========================================
function renderCartPage() {
    const container = document.getElementById("cart-items-container");
    const subtotalEl = document.getElementById("summary-subtotal");
    const totalEl = document.getElementById("summary-total");

    // Only execute if we are on the cart.html page
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Your cart is currently empty. <a href="shop.html" style="color:#1769aa; font-weight:bold;">Continue shopping</a>.</p>`;
        subtotalEl.textContent = "৳0";
        totalEl.textContent = "৳0";
        return;
    }

    let subtotal = 0;
    container.innerHTML = ""; // Clear loading message

    // Generate HTML for each item in the cart
    cart.forEach(item => {
        subtotal += item.price * item.quantity;

        const imageHTML = item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">` : `IMAGE`;

        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-image">
                        ${imageHTML}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>৳${item.price.toLocaleString()}</p>
                    </div>
                </div>

                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button onclick="updateQuantity('${item.id}', 'decrease')">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="updateQuantity('${item.id}', 'increase')">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
                </div>
            </div>
        `;
    });

    // Update summary prices
    subtotalEl.textContent = `৳${subtotal.toLocaleString()}`;
    totalEl.textContent = `৳${subtotal.toLocaleString()}`;
}

// ========================================
// INIT ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    updateCartIconCount();
    renderCartPage();
});