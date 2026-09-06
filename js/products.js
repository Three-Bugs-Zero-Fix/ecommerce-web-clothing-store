/* ============================================================
   Product detail page — loads a single product by ?id= and
   renders it, plus a "You may also like" strip.
   ============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

const loadingEl = document.getElementById("product-loading");
const mainEl = document.getElementById("product-main");
const notFoundEl = document.getElementById("product-not-found");

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let qty = 1;

async function loadProduct() {
    if (!productId) {
        showNotFound();
        return;
    }

    try {
        const doc = await db.collection("products").doc(productId).get();

        if (!doc.exists) {
            showNotFound();
            return;
        }

        currentProduct = { id: doc.id, ...doc.data() };
        renderProduct();
        loadRelatedProducts();

    } catch (error) {
        console.error("Error loading product:", error);
        showNotFound();
    }
}

function showNotFound() {
    loadingEl.style.display = "none";
    notFoundEl.style.display = "block";
}

function renderProduct() {
    const p = currentProduct;

    loadingEl.style.display = "none";
    mainEl.style.display = "block";

    // Set Product Name Title inside Info Box
    const titleName = document.getElementById("product-title-name");
    if (titleName) {
        titleName.textContent = p.name || "Unnamed Product";
    }
    document.title = `${p.name || "Product"} - BlueWear`;

    // Image
    const galleryImg = document.getElementById("product-gallery-image");
    galleryImg.innerHTML = p.image
        ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`
        : "";

    // Price
    const regularPrice = Number(p.price || 0);
    const salePrice = Number(p.discountPrice || 0);
    const isSale = salePrice > 0 && salePrice < regularPrice;
    const currentPrice = isSale ? salePrice : regularPrice;

    const priceBlock = document.getElementById("product-price-block");
    if (isSale) {
        const discountPercent = Math.round(100 - (salePrice / regularPrice) * 100);
        priceBlock.innerHTML = `
            <span class="product-price-current">৳${salePrice.toLocaleString()}</span>
            <span class="product-price-old">৳${regularPrice.toLocaleString()}</span>
            <span class="product-price-discount">${discountPercent}% Off</span>
        `;
    } else {
        priceBlock.innerHTML = `<span class="product-price-current">৳${regularPrice.toLocaleString()}</span>`;
    }

    // Stock note
    const totalStock = Number(p.stock || 0);
    const stockNote = document.getElementById("product-stock-note");
    if (totalStock === 0 && p.stock !== undefined) {
        stockNote.textContent = "Out of stock";
        stockNote.className = "product-stock-note out";
    } else if (totalStock > 0 && totalStock <= 10) {
        stockNote.textContent = `Only ${totalStock} left in stock`;
        stockNote.className = "product-stock-note low";
    } else {
        stockNote.textContent = "";
    }

    // Colors (optional)
    if (Array.isArray(p.colors) && p.colors.length) {
        document.getElementById("color-group").style.display = "block";
        const colorRow = document.getElementById("color-row");
        colorRow.innerHTML = p.colors.map(c =>
            `<button type="button" class="option-chip" data-color="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        ).join("");

        colorRow.querySelectorAll(".option-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                colorRow.querySelectorAll(".option-chip").forEach(c => c.classList.remove("selected"));
                chip.classList.add("selected");
                selectedColor = chip.dataset.color;
            });
        });
    }

    // ===================================
    // SIZES FIX (Handles Objects, Array of strings, or String)
    // ===================================
    const rawSizes = p.sizes || p.size || [];
    let sizes = [];

    if (Array.isArray(rawSizes)) {
        sizes = rawSizes.map(item => {
            if (typeof item === "object" && item !== null) {
                return {
                    size: item.size || item.name || "",
                    stock: item.stock !== undefined ? Number(item.stock) : 99
                };
            }
            return { size: String(item).trim(), stock: 99 };
        }).filter(s => s.size !== "");
    } else if (typeof rawSizes === "string" && rawSizes.trim() !== "") {
        sizes = rawSizes.split(",").map(s => ({ size: s.trim(), stock: 99 })).filter(s => s.size !== "");
    }

    const sizeRow = document.getElementById("size-row");
    const sizeGroup = sizeRow ? sizeRow.closest(".product-option-group") : null;

    if (sizes.length === 0) {
        // If product has no sizes at all, hide size selector
        if (sizeGroup) sizeGroup.style.display = "none";
    } else {
        if (sizeGroup) sizeGroup.style.display = "block";
        sizeRow.innerHTML = sizes.map(s => {
            const outOfStock = Number(s.stock) <= 0;
            return `<button type="button" class="option-chip ${outOfStock ? "disabled" : ""}" data-size="${escapeHtml(s.size)}" ${outOfStock ? "disabled" : ""}>${escapeHtml(s.size)}</button>`;
        }).join("");

        sizeRow.querySelectorAll(".option-chip:not(.disabled)").forEach(chip => {
            chip.addEventListener("click", () => {
                sizeRow.querySelectorAll(".option-chip").forEach(c => c.classList.remove("selected"));
                chip.classList.add("selected");
                selectedSize = chip.dataset.size;
                document.getElementById("size-error").style.display = "none";
            });
        });
    }

    // Wishlist heart toggle
    document.getElementById("wishlist-btn").addEventListener("click", (e) => {
        const btn = e.currentTarget;
        btn.classList.toggle("active");
        btn.textContent = btn.classList.contains("active") ? "♥" : "♡";
    });

    // Description
    renderDescription(p.description || "");

    // Quantity controls
    document.getElementById("qty-minus").addEventListener("click", () => {
        qty = Math.max(1, qty - 1);
        document.getElementById("qty-value").value = qty;
    });
    document.getElementById("qty-plus").addEventListener("click", () => {
        qty += 1;
        document.getElementById("qty-value").value = qty;
    });

    // Add to cart
    document.getElementById("add-to-cart-btn").addEventListener("click", () => {
        if (sizes.length > 0 && !selectedSize) {
            document.getElementById("size-error").textContent = "Please select a size";
            document.getElementById("size-error").style.display = "block";
            return;
        }

        const cartLabel = selectedSize
            ? `${p.name} (${selectedSize}${selectedColor ? ", " + selectedColor : ""})`
            : p.name;

        for (let i = 0; i < qty; i++) {
            addToCart(p.id, cartLabel, currentPrice, p.image || "");
        }
    });
}

function renderDescription(text) {
    const el = document.getElementById("product-description");
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
        el.innerHTML = "";
        return;
    }

    if (lines.length === 1) {
        el.innerHTML = `<p>${escapeHtml(text)}</p>`;
        return;
    }

    const [intro, ...bullets] = lines;
    el.innerHTML = `
        <p>${escapeHtml(intro)}</p>
        <ul>${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
    `;
}

/* =========================
   RELATED PRODUCTS
========================= */

async function loadRelatedProducts() {
    const grid = document.getElementById("related-grid");
    const p = currentProduct;

    try {
        let query;

        if (p.mainCategory) {
            query = db.collection("products").where("mainCategory", "==", p.mainCategory).limit(9);
        } else if (p.category) {
            query = db.collection("products").where("category", "==", p.category).limit(9);
        } else {
            query = db.collection("products").limit(9);
        }

        const snapshot = await query.get();
        const related = [];

        snapshot.forEach(doc => {
            if (doc.id !== p.id) {
                related.push({ id: doc.id, ...doc.data() });
            }
        });

        if (related.length === 0) {
            grid.innerHTML = `<p style="color:#98A2B3; font-size:14px;">No related products yet.</p>`;
            return;
        }

        grid.innerHTML = related.slice(0, 8).map(product => renderRelatedCard(product)).join("");

    } catch (error) {
        console.error("Error loading related products:", error);
        grid.innerHTML = "";
    }
}

function renderRelatedCard(product) {
    const name = product.name || "Unnamed Product";
    const image = product.image || "";
    const regularPrice = Number(product.price || 0);
    const salePrice = Number(product.discountPrice || 0);
    const isSale = salePrice > 0 && salePrice < regularPrice;
    const currentPrice = isSale ? salePrice : regularPrice;

    const priceHTML = isSale
        ? `<span class="price-current">৳${salePrice.toLocaleString()}</span> <span class="price-old">৳${regularPrice.toLocaleString()}</span>`
        : `<span class="price-current">৳${regularPrice.toLocaleString()}</span>`;

    const imageHTML = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
        : `<span>PRODUCT IMAGE</span>`;

    return `
        <article class="product-card">
            <a href="product_details.html?id=${encodeURIComponent(product.id)}" class="product-image">
                ${imageHTML}
            </a>
            <div class="product-details">
                <p class="product-category">${escapeHtml(product.category || "")}</p>
                <h3>${escapeHtml(name)}</h3>
                <div class="price-row">
                    <div>${priceHTML}</div>
                    <button class="cart-icon-btn" title="Add to cart" onclick="addToCart('${escapeHtml(product.id)}', '${escapeHtml(name)}', ${currentPrice}, '${escapeHtml(image)}')">🛒</button>
                </div>
            </div>
        </article>
    `;
}

/* =========================
   HELPERS
========================= */

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[character]));
}

/* =========================
   START
========================= */

loadProduct();