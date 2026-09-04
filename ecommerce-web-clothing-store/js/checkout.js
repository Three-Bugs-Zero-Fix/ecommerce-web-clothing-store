/* ============================================================
   Handles checkout authentication, summary loading, and order placement.
   ============================================================ */

const checkoutMain = document.getElementById("checkout-main");
const authLoading = document.getElementById("auth-loading");
const checkoutForm = document.getElementById("checkout-form");
const placeOrderBtn = document.getElementById("place-order-btn");

let currentUser = null;
let cartItems = JSON.parse(localStorage.getItem("blueWearCart")) || [];
const SHIPPING_FEE = 60; // Flat shipping rate

// ========================================
// 1. AUTHENTICATION GUARD
// ========================================
// This automatically checks if the user is logged in
auth.onAuthStateChanged((user) => {
    if (!user) {
        // If no user is logged in, redirect to login page immediately
        alert("Please login to proceed to checkout.");
        window.location.href = "login.html"; 
    } else {
        // User is logged in
        currentUser = user;
        
        // If cart is empty, send them back to shop
        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            window.location.href = "shop.html";
            return;
        }

        // Show the checkout page and hide the loading screen
        authLoading.style.display = "none";
        checkoutMain.style.display = "block";

        // Pre-fill email or name if we have it in auth profile (Optional)
        // document.getElementById("ship-name").value = user.displayName || "";

        loadOrderSummary();
    }
});

// ========================================
// 2. LOAD ORDER SUMMARY
// ========================================
function loadOrderSummary() {
    const container = document.getElementById("checkout-items-container");
    let subtotal = 0;

    container.innerHTML = "";

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        container.innerHTML += `
            <div class="checkout-item">
                <div>
                    <span class="checkout-item-name">${item.name}</span>
                    <span class="checkout-item-qty">x ${item.quantity}</span>
                </div>
                <span>৳${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });

    const total = subtotal + SHIPPING_FEE;

    document.getElementById("checkout-subtotal").textContent = `৳${subtotal.toLocaleString()}`;
    document.getElementById("checkout-shipping").textContent = `৳${SHIPPING_FEE}`;
    document.getElementById("checkout-total").textContent = `৳${total.toLocaleString()}`;
}

// ========================================
// 3. HANDLE FORM SUBMISSION (PLACE ORDER)
// ========================================
checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload

    if (!currentUser) return;

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing Order...";

    try {
        // Prepare order data
        const orderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            customerName: document.getElementById("ship-name").value.trim(),
            phone: document.getElementById("ship-phone").value.trim(),
            address: document.getElementById("ship-address").value.trim(),
            city: document.getElementById("ship-city").value.trim(),
            zip: document.getElementById("ship-zip").value.trim(),
            items: cartItems, // Save the whole cart array
            subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            shippingFee: SHIPPING_FEE,
            totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + SHIPPING_FEE,
            paymentMethod: document.querySelector('input[name="payment"]:checked').value,
            status: "pending", // Default status for new orders
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save order to Firestore "orders" collection
        await db.collection("orders").add(orderData);

        // Clear local storage cart
        localStorage.removeItem("blueWearCart");

        alert("Order placed successfully! Thank you for shopping with BlueWear.");
        
        // Redirect to profile page to view order history
        window.location.href = "profile.html";

    } catch (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "Place Order";
    }
});