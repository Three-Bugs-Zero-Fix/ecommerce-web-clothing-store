/* ============================================================
   Handles checkout authentication guard, summary loading, and order placement (Supports Guest Checkout).
   ============================================================ */

const checkoutMain = document.getElementById("checkout-main");
const authLoading = document.getElementById("auth-loading");
const checkoutForm = document.getElementById("checkout-form");
const placeOrderBtn = document.getElementById("place-order-btn");

let currentUser = null;
let cartItems = JSON.parse(localStorage.getItem("blueWearCart")) || [];
let shippingFee = 0;

// ========================================
// 1. AUTH STATE CHECK (Allowing Guest Checkout)
// ========================================
auth.onAuthStateChanged((user) => {
    currentUser = user; // Can be null if guest

    // Always fetch latest cart data from localStorage
    cartItems = JSON.parse(localStorage.getItem("blueWearCart")) || [];

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      window.location.href = "shop.html";
      return;
    }

    // Show the checkout page and hide loading screen for everyone (Guests & Logged-in users)
    authLoading.style.display = "none";
    checkoutMain.style.display = "block";

    // If user is logged in, auto-fill their name
    const shipNameInput = document.getElementById("ship-name");
    if (shipNameInput && user && user.displayName) {
        shipNameInput.value = user.displayName;
    }

    loadOrderSummary();
});

// ========================================
// 2. DYNAMIC SHIPPING FEE LOGIC
// ========================================
const shipCity = document.getElementById("ship-city");

if (shipCity) {
    shipCity.addEventListener("change", function() {
        if (this.value === "Dhaka") {
            shippingFee = 60;
        } else {
            shippingFee = 100;
        }
        loadOrderSummary();
    });
}

// ========================================
// 3. UPDATE ITEM QUANTITY IN CHECKOUT
// ========================================
function updateCheckoutQuantity(index, action) {
    if (cartItems[index]) {
        if (action === 'increase') {
            cartItems[index].quantity += 1;
        } else if (action === 'decrease') {
            if (cartItems[index].quantity > 1) {
                cartItems[index].quantity -= 1;
            } else {
                return;
            }
        }

        localStorage.setItem("blueWearCart", JSON.stringify(cartItems));

        const navCartCount = document.getElementById("nav-cart-count");
        if (navCartCount) {
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            navCartCount.textContent = totalItems;
        }

        loadOrderSummary();
    }
}

// ========================================
// 4. UPDATE ITEM OPTION IN CHECKOUT
// ========================================
function updateCheckoutItemOption(index, field, newValue) {
    if (cartItems[index]) {
        cartItems[index][field] = newValue;
        localStorage.setItem("blueWearCart", JSON.stringify(cartItems));
        loadOrderSummary();
    }
}

// ========================================
// 5. LOAD ORDER SUMMARY
// ========================================
async function loadOrderSummary() {
  const container = document.getElementById("checkout-items-container");
  let subtotal = 0;

  if (!container) return;
  container.innerHTML = "";

  for (let index = 0; index < cartItems.length; index++) {
    const item = cartItems[index];
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const isMinQty = item.quantity <= 1;
    const minusBtnStyle = isMinQty ? 'opacity: 0.4; cursor: pointer;' : '';

    let colors = ["Black", "Blue", "White", "Red", "Grey"];
    let sizes = ["S", "M", "L", "XL", "XXL"];

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

    if (!colors.includes(item.color) && item.color) colors.push(item.color);
    if (!sizes.includes(item.size) && item.size) sizes.push(item.size);

    let colorOptionsHtml = colors.map(c => `<option value="${c}" ${item.color === c ? 'selected' : ''}>${c}</option>`).join('');
    let sizeOptionsHtml = sizes.map(s => `<option value="${s}" ${item.size === s ? 'selected' : ''}>${s}</option>`).join('');

    container.innerHTML += `
    <div class="checkout-item" style="display: flex; align-items: flex-start; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; gap: 12px;">
        <img src="${item.image || ""}" alt="${item.name}" class="checkout-item-img" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;" />
        <div class="checkout-item-info" style="flex: 1;">
            <span class="checkout-item-name" style="font-weight: 600; font-size: 14px; color: #172033; display: block; margin-bottom: 4px;">${item.name}</span>
            
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 12px;">
                <div>
                    <label style="color: #64748b; font-size: 10px; font-weight: 600;">COLOR:</label>
                    <select onchange="updateCheckoutItemOption(${index}, 'color', this.value)" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; font-size: 11px; cursor: pointer;">
                        ${colorOptionsHtml}
                    </select>
                </div>
                <div>
                    <label style="color: #64748b; font-size: 10px; font-weight: 600;">SIZE:</label>
                    <select onchange="updateCheckoutItemOption(${index}, 'size', this.value)" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; font-size: 11px; cursor: pointer;">
                        ${sizeOptionsHtml}
                    </select>
                </div>
            </div>

            <div style="display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #fff; width: fit-content;">
                <button type="button" onclick="updateCheckoutQuantity(${index}, 'decrease')" style="${minusBtnStyle} padding: 3px 8px; background: #f8fafc; border: none; cursor: pointer; font-weight: bold; font-size: 12px;">-</button>
                <input type="text" value="${item.quantity}" readonly style="width: 25px; text-align: center; border: none; background: #fff; font-weight: 600; font-size: 12px;">
                <button type="button" onclick="updateCheckoutQuantity(${index}, 'increase')" style="padding: 3px 8px; background: #f8fafc; border: none; cursor: pointer; font-weight: bold; font-size: 12px;">+</button>
            </div>
        </div>
        <span class="checkout-item-price" style="font-weight: 600; font-size: 14px; color: #2563eb;">৳${itemTotal.toLocaleString()}</span>
    </div>
    `;
  }

  const total = subtotal + shippingFee;

  document.getElementById("checkout-subtotal").textContent = `৳${subtotal.toLocaleString()}`;
  document.getElementById("checkout-shipping").textContent = `৳${shippingFee}`;
  document.getElementById("checkout-total").textContent = `৳${total.toLocaleString()}`;
}

// ========================================
// 6. HANDLE FORM SUBMISSION (PLACE ORDER FOR GUESTS & USERS)
// ========================================
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (shippingFee === 0) {
      alert("Please select a city/district for delivery.");
      return;
  }

  const phoneInputVal = document.getElementById("ship-phone").value.trim();
  if (!/^\d{10}$/.test(phoneInputVal)) {
      alert("Please enter a valid 10-digit phone number after +880 (e.g., 017XXXXXXXX).");
      return;
  }

  const fullPhoneNumber = "+880" + phoneInputVal;

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Processing Order...";

  try {
      const subtotalCalc = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
      const orderData = {
          userId: currentUser ? currentUser.uid : "guest-user",
          userEmail: currentUser ? currentUser.email : "guest@bluewear.com",
          customerName: document.getElementById("ship-name").value.trim(),
          phone: fullPhoneNumber,
          address: document.getElementById("ship-address").value.trim(),
          city: document.getElementById("ship-city").value,
          zip: document.getElementById("ship-zip").value.trim(),
          items: cartItems,
          subtotal: subtotalCalc,
          shippingFee: shippingFee,
          totalAmount: subtotalCalc + shippingFee,
          paymentMethod: document.querySelector('input[name="payment"]:checked').value,
          status: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("orders").add(orderData);

      localStorage.removeItem("blueWearCart");
      cartItems = []; 

      const navCartCount = document.getElementById("nav-cart-count");
      if (navCartCount) {
          navCartCount.textContent = "0";
      }

      checkoutForm.reset(); 
      placeOrderBtn.textContent = "Order Placed ✅"; 
      placeOrderBtn.style.backgroundColor = "#2e7d32";
      
      shippingFee = 0;
      
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
                  Redirecting to shop...
              </p>
          </div>
      `;

      setTimeout(() => {
          window.location.href = "shop.html";
      }, 2000);

  } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
  }
});