const productsGrid = document.getElementById("product-grid");
const productCount = document.getElementById("product-count");

const searchInput = document.getElementById("shop-search");
const clearFiltersButton =
    document.getElementById("clear-filters");

const categoryFilters = document.querySelectorAll(
    'input[name="category"]'
);
const priceFilters = document.querySelectorAll(
    'input[name="price"]'
);

const sortSelect = document.getElementById("sort-products");

let products = [];
let filteredProducts = [];


/* =========================
   URL CATEGORY
========================= */

const urlParams = new URLSearchParams(window.location.search);
const urlCategory = urlParams.get("category");


/* =========================
   APPLY URL CATEGORY
========================= */

function applyUrlCategory() {

    if (!urlCategory) {
        return;
    }

    categoryFilters.forEach((checkbox) => {

        if (
            checkbox.value.toLowerCase() ===
            urlCategory.toLowerCase()
        ) {
            checkbox.checked = true;
        }

    });

}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

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
                ...doc.data()
            });

        });

        filteredProducts = [...products];

        applyUrlCategory();

        applyFilters();

    } catch (error) {

        console.error("Error loading products:", error);

        productsGrid.innerHTML = `
            <div class="shop-error">
                Could not load products.
                Please try again.
            </div>
        `;

        productCount.textContent = "0 Products";
    }
}


/* =========================
   APPLY FILTERS
========================= */

function applyFilters() {

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedCategories = Array.from(categoryFilters)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value.toLowerCase());

    const selectedPrice = Array.from(priceFilters)
        .find((radio) => radio.checked)?.value || "all";


    filteredProducts = products.filter((product) => {

        const name = String(product.name || "").toLowerCase();

        const category = String(
            product.category || ""
        ).toLowerCase();

        const price = getProductPrice(product);


        /* SEARCH */

        const matchesSearch =
            name.includes(searchText);


        /* CATEGORY */

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(category);


        /* PRICE */

        let matchesPrice = true;

        if (selectedPrice === "under-500") {

            matchesPrice = price < 500;

        } else if (selectedPrice === "500-1000") {

            matchesPrice =
                price >= 500 &&
                price <= 1000;

        } else if (selectedPrice === "1000-2000") {

            matchesPrice =
                price > 1000 &&
                price <= 2000;

        } else if (selectedPrice === "above-2000") {

            matchesPrice = price > 2000;
        }


        return (
            matchesSearch &&
            matchesCategory &&
            matchesPrice
        );
    });


    applySorting();

    displayProducts();
}


/* =========================
   SORT PRODUCTS
========================= */

function applySorting() {

    const sortValue = sortSelect
        ? sortSelect.value
        : "default";


    if (sortValue === "newest") {

        filteredProducts.sort((a, b) => {

            const aTime = getTimestamp(a.createdAt);
            const bTime = getTimestamp(b.createdAt);

            return bTime - aTime;
        });

    } else if (sortValue === "price-low") {

        filteredProducts.sort((a, b) => {

            return getProductPrice(a) -
                getProductPrice(b);
        });

    } else if (sortValue === "price-high") {

        filteredProducts.sort((a, b) => {

            return getProductPrice(b) -
                getProductPrice(a);
        });

    } else if (sortValue === "name") {

        filteredProducts.sort((a, b) => {

            return String(a.name || "")
                .localeCompare(
                    String(b.name || "")
                );
        });
    }
}


/* =========================
    DISPLAY PRODUCTS 
========================= */

function displayProducts() {

    productCount.textContent =
        filteredProducts.length +
        (
            filteredProducts.length === 1
                ? " Product"
                : " Products"
        );


    if (filteredProducts.length === 0) {

        productsGrid.innerHTML = `
            <div class="shop-empty">
                <h2>No products found</h2>

                <p>
                    Try changing your search or filters.
                </p>
            </div>
        `;

        return;
    }


    productsGrid.innerHTML =
        filteredProducts.map((product) => {

            const name =
                product.name || "Unnamed Product";

            const category =
                product.category || "Product";

            const images =
                Array.isArray(product.images)
                    ? product.images
                    : [];

            const image =
                images.length > 0
                    ? images[0]
                    : "";


            const regularPrice =
                Number(product.price || 0);

            const salePrice =
                Number(product.salePrice || 0);

            const isSale =
                product.sale === true &&
                salePrice > 0 &&
                salePrice < regularPrice;


            const currentPrice =
                isSale
                    ? salePrice
                    : regularPrice;


            const stock =
                Number(product.stock || 0);


            /* BADGE */

            let badgeHTML = "";

            if (isSale) {

                badgeHTML = `
                    <span class="product-badge">
                        SALE
                    </span>
                `;

            } else if (product.featured) {

                badgeHTML = `
                    <span class="product-badge">
                        FEATURED
                    </span>
                `;

            }


            /* IMAGE */

            let imageHTML;

            if (image) {

                imageHTML = `
                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(name)}"
                        loading="lazy"
                    >
                `;

            } else {

                imageHTML = `
                    <span>
                        PRODUCT IMAGE
                    </span>
                `;
            }


            /* PRICE */

            let priceHTML;

            if (isSale) {

                priceHTML = `
                    <span class="old-price">
                        ৳${regularPrice.toLocaleString()}
                    </span>

                    <span class="sale-price">
                        ৳${salePrice.toLocaleString()}
                    </span>
                `;

            } else {

                priceHTML = `
                    <span>
                        ৳${regularPrice.toLocaleString()}
                    </span>
                `;
            }


            /* STOCK */

            let stockHTML = "";
            
            // To prevent adding out of stock items to cart
            let isOutOfStock = false; 

            if (stock === 0) {
                isOutOfStock = true;
                stockHTML = `
                    <p class="product-stock out-of-stock" style="color: #d12e2e; font-size: 13px; margin-top:5px;">
                        Out of stock
                    </p>
                `;

            } else if (stock <= 5) {

                stockHTML = `
                    <p class="product-stock low-stock" style="color: #e59700; font-size: 13px; margin-top:5px;">
                        Only ${stock} left
                    </p>
                `;
            }

            /* 
             * ==============================
             * UPDATE: ADD TO CART BUTTON 
             * ==============================
             */
            const cartButtonHTML = isOutOfStock 
                ? `<button class="primary-btn" style="width: 100%; margin-top: 15px; opacity: 0.5; cursor: not-allowed;" disabled>Out of Stock</button>`
                : `<button class="primary-btn" style="width: 100%; margin-top: 15px;" onclick="addToCart('${escapeHtml(product.id)}', '${escapeHtml(name)}', ${currentPrice}, '${escapeHtml(image)}')">Add to Cart</button>`;


            return `
                <article class="product-card">

                    <a
                        href="product.html?id=${encodeURIComponent(product.id)}"
                        class="product-image"
                    >

                        ${badgeHTML}

                        ${imageHTML}

                    </a>


                    <div class="product-details">

                        <p class="product-category">
                            ${escapeHtml(category)}
                        </p>

                        <h3>
                            ${escapeHtml(name)}
                        </h3>


                        <p class="price">
                            ${priceHTML}
                        </p>

                        ${stockHTML}
                        
                        <!-- The Cart Button is injected here -->
                        ${cartButtonHTML}

                    </div>

                </article>
            `;

        }).join("");
}


/* =========================
   GET PRODUCT PRICE
========================= */

function getProductPrice(product) {

    const regularPrice =
        Number(product.price || 0);

    const salePrice =
        Number(product.salePrice || 0);

    if (
        product.sale === true &&
        salePrice > 0 &&
        salePrice < regularPrice
    ) {
        return salePrice;
    }

    return regularPrice;
}


/* =========================
   GET FIRESTORE TIMESTAMP
========================= */

function getTimestamp(timestamp) {

    if (!timestamp) {
        return 0;
    }

    if (typeof timestamp.toMillis === "function") {
        return timestamp.toMillis();
    }

    if (timestamp.seconds) {
        return timestamp.seconds * 1000;
    }

    return 0;
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    return String(value || "").replace(
        /[&<>"']/g,
        function (character) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];

        }
    );
}



/* =========================
   EVENTS
========================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );
}


categoryFilters.forEach((checkbox) => {

    checkbox.addEventListener(
        "change",
        applyFilters
    );

});


priceFilters.forEach((radio) => {

    radio.addEventListener(
        "change",
        applyFilters
    );

});


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        applyFilters
    );
}


if (clearFiltersButton) {

    clearFiltersButton.addEventListener("click", () => {

        if (searchInput) {
            searchInput.value = "";
        }

        categoryFilters.forEach((checkbox) => {
            checkbox.checked = false;
        });

        priceFilters.forEach((radio) => {
            radio.checked = false;
        });

        if (sortSelect) {
            sortSelect.value = "default";
        }

        applyFilters();
    });
}

/* =========================
   START
========================= */

loadProducts();