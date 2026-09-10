/* ============================================================
   Loads products marked featured:true from Firestore and
   renders them into the homepage's "Featured Products" grid.
   Card design matches shop.css (icon-style cart button).
   ============================================================ */

async function loadFeaturedProducts() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const snapshot = await db
      .collection("products")
      .where("featured", "==", true)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(4)
      .get();

    if (snapshot.empty) {
      grid.innerHTML = `<p class="loading-text">No featured products yet.</p>`;
      return;
    }

    grid.innerHTML = snapshot.docs
      .map((doc) => renderFeaturedCard({ id: doc.id, ...doc.data() }))
      .join("");

  } catch (error) {
    console.error("Error loading featured products:", error);
    grid.innerHTML = `<p class="loading-text">Could not load featured products.</p>`;
  }
}

function renderFeaturedCard(product) {
  const name = product.name || "Unnamed Product";
  const category = product.category || "Product";
  const image = product.image || "";

  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.discountPrice || 0);
  const isSale = salePrice > 0 && salePrice < regularPrice;
  const currentPrice = isSale ? salePrice : regularPrice;
  const stock = Number(product.stock || 0);
  const isOutOfStock = stock === 0;

  let discountPercent = 0;
  let badgeHTML = "";
  let saveBadgeHTML = "";
  let priceHTML;

  if (isSale) {
    discountPercent = Math.round(100 - (salePrice / regularPrice) * 100);
    badgeHTML = `<span class="product-badge">-${discountPercent}%</span>`;

    const saveAmount = regularPrice - salePrice;
    saveBadgeHTML = `<span class="save-badge">🏷 Save ৳${saveAmount.toLocaleString()}</span>`;

    priceHTML = `
      <span class="price-current">৳${salePrice.toLocaleString()}</span>
      <span class="price-old">৳${regularPrice.toLocaleString()}</span>
      <span class="price-discount">-${discountPercent}%</span>
    `;
  } else {
    badgeHTML = `<span class="product-badge">NEW</span>`;
    priceHTML = `<span class="price-current">৳${regularPrice.toLocaleString()}</span>`;
  }

  const imageHTML = image
    ? `<img src="${escapeHtmlFeatured(image)}" alt="${escapeHtmlFeatured(name)}" loading="lazy">`
    : `<span>PRODUCT IMAGE</span>`;

  const cartButtonHTML = isOutOfStock
    ? `<button class="cart-icon-btn" disabled title="Out of stock">✕</button>`
    : `<button class="cart-icon-btn" title="Add to cart" onclick="addToCart('${escapeHtmlFeatured(product.id)}', '${escapeHtmlFeatured(name)}', ${currentPrice}, '${escapeHtmlFeatured(image)}')">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 5h6"/>
      <path d="M19 2v6"/>
      <path d="m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18"/>
      <path d="M4.564 5H12"/>
      <path d="M6.25 14h12.712a2 2 0 001.991-1.57l.172-1.041"/>
      <circle cx="18" cy="20" r="2"/>
      <circle cx="8" cy="20" r="2"/>
    </svg>
  </button>`;

  return `
    <article class="product-card">
      <a href="pages/product_details.html?id=${encodeURIComponent(product.id)}" class="product-image">
        ${badgeHTML}
        ${imageHTML}
      </a>

      <div class="product-details">
        <p class="product-category">${escapeHtmlFeatured(category)}</p>
        <h3>${escapeHtmlFeatured(name)}</h3>

        ${saveBadgeHTML}

        <div class="price-row">
          <div>${priceHTML}</div>
          ${cartButtonHTML}
        </div>
      </div>
    </article>
  `;
}

function escapeHtmlFeatured(value) {
  return String(value || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

loadFeaturedProducts();