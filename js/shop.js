/* ============================================================
   CATEGORY MAP (same as admin panel)
   ============================================================ */

const CATEGORY_MAP = {
  Men: [
    "Half Sleeve T-Shirt",
    "Full Sleeve T-Shirt",
    "Maggie",
    "Shirt",
    "Polo T-Shirt",
    "Hoodie",
    "Jacket",
    "Joggers",
    "Sweatshirt",
    "Comfy Trouser",
    "Sports Trouser",
    "Shorts",
    "Underwear",
    "Socks",
    "Panjabi",
    "Tupi",
    "Jeans",
    "Pajama",
    "Chino Pants",
    "Cargo Pants",
    "Formal Pants",
    "Sando & Tank Top",
    "Waistcoats",
  ],
  Women: [
    "T-Shirt",
    "Comfy Trouser",
    "Kurti Tunic And Tops",
    "Pajamas",
    "Pants",
    "Palazzo",
    "Leggings",
    "Hoodie",
    "Sweatshirt",
    "Cargo Pants",
    "Shrug",
    "Co-Ords",
    "Tops",
    "Kurti",
    "2pc Salwar Kameez",
    "3pc Salwar Kameez",
    "Denim Pants",
  ],
  Teens: ["Boys", "Girls"],
  Kids: ["Boys", "Girls"],
  Sports: ["Sports T-Shirt", "Football Jersey"],
  "Face Mask": [
    "Professional 7 Layer Mask",
    "Sports Edition",
    "Womens Designer Edition",
    "Womens Embroidery Edition",
    "Kids Mask",
    "Anti Dust & Anti Pollen Mask",
  ],
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/* =========================
   BUILD CATEGORY FILTER UI
========================= */

function buildCategoryFilter() {
  const container = document.getElementById("category-filter-list");
  if (!container) return;

  container.innerHTML = Object.entries(CATEGORY_MAP)
    .map(([main, subs]) => {
      const listId = `sub-list-${slugify(main)}`;
      return `
        <div class="cat-block">
          <div class="cat-main-row">
            <label>
              <input type="checkbox" name="category" class="category-filter" value="${main}">
              ${main}
            </label>
            <button type="button" class="cat-toggle" data-target="${listId}">▾</button>
          </div>
          <div class="cat-sub-list" id="${listId}">
            ${subs
              .map(
                (s) => `
              <label class="cat-sub-label">
                <input type="checkbox" name="subcategory" class="subcategory-filter" value="${s}">
                ${s}
              </label>
            `,
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  // অ্যারো টোগল
  container.querySelectorAll(".cat-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = document.getElementById(btn.dataset.target);
      if (list) {
        list.classList.toggle("open");
        btn.classList.toggle("open");
      }
    });
  });

  // ক্যাটাগরি চেক করলে স্বয়ংক্রিয়ভাবে সাব-ক্যাটাগরি ওপেন হওয়া
  container.querySelectorAll('input[name="category"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const catBlock = e.target.closest(".cat-block");
      if (catBlock) {
        const subList = catBlock.querySelector(".cat-sub-list");
        const toggleBtn = catBlock.querySelector(".cat-toggle");

        if (e.target.checked) {
          if (subList) subList.classList.add("open");
          if (toggleBtn) toggleBtn.classList.add("open");
        } else {
          if (subList) subList.classList.remove("open");
          if (toggleBtn) toggleBtn.classList.remove("open");
        }
      }
    });
  });
}

buildCategoryFilter();

/* =========================
   ELEMENT REFERENCES
========================= */

const productsGrid = document.getElementById("product-grid");
const productCount = document.getElementById("product-count");
const clearFiltersButton = document.getElementById("clear-filters");
const sortSelect = document.getElementById("sort-products");

let products = [];
let filteredProducts = [];

/* =========================
   URL CATEGORY
========================= */

const urlParams = new URLSearchParams(window.location.search);
const urlCategory = urlParams.get("category");

function applyUrlCategory() {
  if (!urlCategory) return;

  const categoryFilters = document.querySelectorAll('input[name="category"]');
  categoryFilters.forEach((checkbox) => {
    if (checkbox.value.toLowerCase() === urlCategory.toLowerCase()) {
      checkbox.checked = true;
      const catBlock = checkbox.closest(".cat-block");
      if (catBlock) {
        const subList = catBlock.querySelector(".cat-sub-list");
        const toggleBtn = catBlock.querySelector(".cat-toggle");
        if (subList) subList.classList.add("open");
        if (toggleBtn) toggleBtn.classList.add("open");
      }
    }
  });
}

/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
  if (!productsGrid) return;

  productsGrid.innerHTML = `
        <div class="shop-loading">
            Loading products...
        </div>
    `;

  try {
    const snapshot = await db
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();

    products = [];

    snapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    filteredProducts = [...products];

    applyUrlCategory();
    applyFilters();
  } catch (error) {
    console.error("Error loading products:", error);

    productsGrid.innerHTML = `
            <div class="shop-error">
                Could not load products. Please try again.
            </div>
        `;

    if (productCount) productCount.textContent = "0 Products";
  }
}

/* =========================
   APPLY FILTERS
========================= */

function applyFilters() {
  const searchInput = document.getElementById("shop-search");
  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const categoryFilters = document.querySelectorAll('input[name="category"]');
  const subCategoryFilters = document.querySelectorAll(
    'input[name="subcategory"]',
  );
  const priceFilters = document.querySelectorAll('input[name="price"]');

  const selectedMainCategories = Array.from(categoryFilters)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value.toLowerCase());

  const selectedSubCategories = Array.from(subCategoryFilters)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value.toLowerCase());

  const selectedPrice =
    Array.from(priceFilters).find((radio) => radio.checked)?.value || "all";

  filteredProducts = products.filter((product) => {
    const name = String(product.name || "").toLowerCase();
    const mainCategory = String(product.mainCategory || "").toLowerCase();
    const subCategory = String(product.category || "").toLowerCase();
    const description = String(product.description || "").toLowerCase();

    const price = getProductPrice(product);

    /* SEARCH MATCHING (Name, Main Category, Sub Category, Description) */
    const matchesSearch =
      !searchText ||
      name.includes(searchText) ||
      mainCategory.includes(searchText) ||
      subCategory.includes(searchText) ||
      description.includes(searchText);

    /* CATEGORY MATCHING */
    const noFiltersSelected =
      selectedMainCategories.length === 0 && selectedSubCategories.length === 0;

    const matchesCategory =
      noFiltersSelected ||
      selectedMainCategories.includes(mainCategory) ||
      selectedSubCategories.includes(subCategory);

    /* PRICE MATCHING */
    let matchesPrice = true;

    if (selectedPrice === "under-500") {
      matchesPrice = price < 500;
    } else if (selectedPrice === "500-1000") {
      matchesPrice = price >= 500 && price <= 1000;
    } else if (selectedPrice === "1000-2000") {
      matchesPrice = price > 1000 && price <= 2000;
    } else if (selectedPrice === "above-2000") {
      matchesPrice = price > 2000;
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  applySorting();
  displayProducts();
}

/* =========================
   SORT PRODUCTS
========================= */

function applySorting() {
  const sortValue = sortSelect ? sortSelect.value : "default";

  if (sortValue === "newest") {
    filteredProducts.sort((a, b) => {
      const aTime = getTimestamp(a.createdAt);
      const bTime = getTimestamp(b.createdAt);
      return bTime - aTime;
    });
  } else if (sortValue === "price-low") {
    filteredProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sortValue === "price-high") {
    filteredProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  } else if (sortValue === "name") {
    filteredProducts.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }
}

/* =========================
   DISPLAY PRODUCTS 
========================= */

function displayProducts() {
  if (productCount) {
    productCount.textContent =
      filteredProducts.length +
      (filteredProducts.length === 1 ? " Product" : " Products");
  }

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
            <div class="shop-empty">
                <h2>No products found</h2>
                <p>Try changing your search or filters.</p>
            </div>
        `;
    return;
  }

  // আপনার দেওয়া SVG আইকন
  const cartSvgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-plus">
      <path d="M16 5h6"/>
      <path d="M19 2v6"/>
      <path d="m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18"/>
      <path d="M4.564 5H12"/>
      <path d="M6.25 14h12.712a2 2 0 001.991-1.57l.172-1.041"/>
      <circle cx="18" cy="20" r="2"/>
      <circle cx="8" cy="20" r="2"/>
    </svg>
  `;

  productsGrid.innerHTML = filteredProducts
    .map((product) => {
      const name = product.name || "Unnamed Product";
      const category = product.category || "Product";
      const image = product.image || "";

      const regularPrice = Number(product.price || 0);
      const salePrice = Number(product.discountPrice || 0);
      const isSale = salePrice > 0 && salePrice < regularPrice;

      const currentPrice = isSale ? salePrice : regularPrice;
      const stock = Number(product.stock || 0);

      /* BADGE */
      let badgeHTML = "";
      let discountPercent = 0;

      if (isSale) {
        discountPercent = Math.round(100 - (salePrice / regularPrice) * 100);
        badgeHTML = `<span class="product-badge">-${discountPercent}%</span>`;
      } else if (product.featured) {
        badgeHTML = `<span class="product-badge">FEATURED</span>`;
      }

      /* IMAGE */
      let imageHTML = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
        : `<span>PRODUCT IMAGE</span>`;

      /* PRICE */
      let priceHTML;
      let saveBadgeHTML = "";

      if (isSale) {
        const saveAmount = regularPrice - salePrice;
        saveBadgeHTML = `<span class="save-badge">🏷 Save ৳${saveAmount.toLocaleString()}</span>`;
        priceHTML = `
                    <span class="price-current">৳${salePrice.toLocaleString()}</span>
                    <span class="price-old">৳${regularPrice.toLocaleString()}</span>
                    <span class="price-discount">-${discountPercent}%</span>
                `;
      } else {
        priceHTML = `<span class="price-current">৳${regularPrice.toLocaleString()}</span>`;
      }

      /* STOCK */
      let stockHTML = "";
      let isOutOfStock = false;

      if (stock === 0) {
        isOutOfStock = true;
        stockHTML = `<p class="product-stock out-of-stock" style="color: #d12e2e; font-size: 13px; margin-top:5px;">Out of stock</p>`;
      } else if (stock <= 5) {
        stockHTML = `<p class="product-stock low-stock" style="color: #e59700; font-size: 13px; margin-top:5px;">Only ${stock} left</p>`;
      }

      const cartButtonHTML = isOutOfStock
        ? `<button class="cart-icon-btn" disabled title="Out of stock">✕</button>`
        : `<button class="cart-icon-btn" title="Add to cart" onclick="addToCart('${escapeHtml(product.id)}', '${escapeHtml(name)}', ${currentPrice}, '${escapeHtml(image)}')">${cartSvgIcon}</button>`;

      return `
        <article class="product-card">
            <a href="product_details.html?id=${encodeURIComponent(product.id)}" class="product-image">
                ${badgeHTML}
                ${imageHTML}
            </a>

            <div class="product-details">
                <p class="product-category">${escapeHtml(category)}</p>
                <h3>${escapeHtml(name)}</h3>
                ${saveBadgeHTML}
                <div class="price-row">
                    <div>${priceHTML}</div>
                    ${cartButtonHTML}
                </div>
                ${stockHTML}
            </div>
        </article>
      `;
    })
    .join("");
}

/* =========================
   GET PRODUCT PRICE
========================= */

function getProductPrice(product) {
  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.discountPrice || 0);
  if (salePrice > 0 && salePrice < regularPrice) {
    return salePrice;
  }
  return regularPrice;
}

/* =========================
   GET FIRESTORE TIMESTAMP
========================= */

function getTimestamp(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000;
  return 0;
}

/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

/* =========================
   EVENTS BINDING
========================= */

function setupEventListeners() {
  const searchInput = document.getElementById("shop-search");

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
    searchInput.addEventListener("keyup", applyFilters);
  }

  document.addEventListener("change", (e) => {
    if (
      e.target.name === "category" ||
      e.target.name === "subcategory" ||
      e.target.name === "price"
    ) {
      applyFilters();
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFilters);
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";

      document
        .querySelectorAll(
          'input[name="category"], input[name="subcategory"], input[name="price"]',
        )
        .forEach((el) => {
          el.checked = false;
        });

      document.querySelectorAll(".cat-sub-list").forEach((el) => {
        el.classList.remove("open");
      });
      document.querySelectorAll(".cat-toggle").forEach((el) => {
        el.classList.remove("open");
      });

      if (sortSelect) sortSelect.value = "default";

      applyFilters();
    });
  }
}

// Event Listeners সক্রিয় করা
setupEventListeners();

/* =========================
   START
========================= */

loadProducts();
