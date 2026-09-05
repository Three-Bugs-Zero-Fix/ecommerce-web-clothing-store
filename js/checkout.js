/* ============================================================
   Handles checkout authentication, summary loading, and order placement.
   ============================================================ */

const checkoutMain = document.getElementById("checkout-main");
const authLoading = document.getElementById("auth-loading");
const checkoutForm = document.getElementById("checkout-form");
const placeOrderBtn = document.getElementById("place-order-btn");

let currentUser = null;
let cartItems = JSON.parse(localStorage.getItem("blueWearCart")) || [];
let shippingFee = 0; // Default is 0 until a city is selected

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

        loadOrderSummary();
    }
});


// ========================================
// 2. DYNAMIC SHIPPING FEE LOGIC
// ========================================
const shipCity = document.getElementById("ship-city");

if (shipCity) {
    shipCity.addEventListener("change", function() {
        // If Dhaka is selected, fee is 60. Otherwise, 100.
        if (this.value === "Dhaka") {
            shippingFee = 60;
        } else {
            shippingFee = 100;
        }
        
        // Recalculate and update the UI
        loadOrderSummary();
    });
}


// ========================================
// 3. LOAD ORDER SUMMARY
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

    const total = subtotal + shippingFee;

    document.getElementById("checkout-subtotal").textContent = `৳${subtotal.toLocaleString()}`;
    document.getElementById("checkout-shipping").textContent = `৳${shippingFee}`;
    document.getElementById("checkout-total").textContent = `৳${total.toLocaleString()}`;
}


// ========================================
// 4. HANDLE FORM SUBMISSION (PLACE ORDER)
// ========================================
checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload

    if (!currentUser) return;
    
    // Make sure a city is selected
    if (shippingFee === 0) {
        alert("Please select a city/district for delivery.");
        return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing Order...";

    try {
        // Calculate subtotal for the database
        const subtotalCalc = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Prepare order data
        const orderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            customerName: document.getElementById("ship-name").value.trim(),
            phone: document.getElementById("ship-phone").value.trim(),
            address: document.getElementById("ship-address").value.trim(),
            city: document.getElementById("ship-city").value, // Dynamically selected city
            zip: document.getElementById("ship-zip").value.trim(),
            items: cartItems, // Save the whole cart array
            subtotal: subtotalCalc,
            shippingFee: shippingFee, // Dynamic fee based on city
            totalAmount: subtotalCalc + shippingFee,
            paymentMethod: document.querySelector('input[name="payment"]:checked').value,
            status: "pending", // Default status for new orders
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save order to Firestore "orders" collection
        await db.collection("orders").add(orderData);

        // ==========================================
        // UPDATE: UI CHANGES & REDIRECT LOGIC
        // ==========================================

        // 1. Clear local storage cart
        localStorage.removeItem("blueWearCart");
        cartItems = []; 

        // 2. Make the Navbar cart count 0 immediately
        const navCartCount = document.getElementById("nav-cart-count");
        if (navCartCount) {
            navCartCount.textContent = "0";
        }

        // 3. Reset form and update button
        checkoutForm.reset(); 
        placeOrderBtn.textContent = "Order Placed ✅"; 
        placeOrderBtn.style.backgroundColor = "#2e7d32"; // Optional: Make button green
        
        shippingFee = 0;
        
        // 4. Clear the order summary and show success message
        document.getElementById("checkout-subtotal").textContent = "৳0";
        document.getElementById("checkout-shipping").textContent = "৳0";
        document.getElementById("checkout-total").textContent = "৳0";
        document.getElementById("checkout-items-container").innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
                <span style="font-size: 40px;">✅</span>
                <p style="color: #2e7d32; font-weight: bold; font-size: 16px; margin-top: 10px;">
                    Your order has been placed successfully!
                </p>
                <p style="color: #666; font-size: 13px; margin-top: 5px;">
                    Redirecting to your profile...
                </p>
            </div>
        `;

        // 5. Wait 2 seconds (2000 milliseconds) then redirect to profile page
        setTimeout(() => {
            window.location.href = "profile.html";
        }, 2000);

    } catch (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "Place Order";
    }
});