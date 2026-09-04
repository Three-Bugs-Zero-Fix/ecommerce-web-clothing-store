const tableBody = document.getElementById("products-table-body");
const productCount = document.getElementById("product-count");
const searchInput = document.getElementById("product-search");
const categoryFilter = document.getElementById("category-filter");
const emptyProducts = document.getElementById("empty-products");

const deleteModal = document.getElementById("delete-modal");
const cancelDelete = document.getElementById("cancel-delete");
const confirmDelete = document.getElementById("confirm-delete");

let products = [];
let filteredProducts = [];
let productToDelete = null;

/* =========================
LOAD PRODUCTS
========================= */

async function loadProducts() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">
                Loading products...
            </td>
        </tr>
    `;

    try {

        const snapshot = await db.collection("products").get();

        products = [];

        snapshot.forEach((doc) => {

            products.push({
                id: doc.id,
                ...doc.data()
            });

        });

        products.sort((a, b) => {

            const dateA = a.createdAt?.toMillis
                ? a.createdAt.toMillis()
                : 0;

            const dateB = b.createdAt?.toMillis
                ? b.createdAt.toMillis()
                : 0;

            return dateB - dateA;

        });

        filteredProducts = [...products];

        displayProducts();

    } catch (error) {

        console.error("Error loading products:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Could not load products.
                </td>
            </tr>
        `;

        productCount.textContent = "0 Products";
    }
}

/* =========================
DISPLAY PRODUCTS
========================= */

function displayProducts() {

productCount.textContent =
    filteredProducts.length +
    (filteredProducts.length === 1 ? " Product" : " Products");


if (filteredProducts.length === 0) {

    tableBody.innerHTML = "";

    emptyProducts.style.display = "block";

    return;
}


emptyProducts.style.display = "none";


tableBody.innerHTML = filteredProducts.map((product) => {

    const name = product.name || "Unnamed Product";

    const category = product.category || "Unknown";

    const images = product.images || [];

    const image = images.length > 0 ? images[0] : "";

    const stock = Number(product.stock || 0);

    const price = Number(product.price || 0);

    const salePrice = Number(product.salePrice || 0);

    const isSale =
        product.sale === true &&
        salePrice > 0;


    let priceHTML;

    if (isSale) {

        priceHTML = `
            <span class="old-price">
                ৳${price.toLocaleString()}
            </span>

            <span class="sale-price">
                ৳${salePrice.toLocaleString()}
            </span>
        `;

    } else {

        priceHTML = `
            ৳${price.toLocaleString()}
        `;
    }


    let stockClass = "stock-good";

    if (stock === 0) {
        stockClass = "stock-out";
    } else if (stock <= 5) {
        stockClass = "stock-low";
    }


    let stockText;

    if (stock === 0) {
        stockText = "Out of stock";
    } else {
        stockText = stock;
    }


    let statusHTML;

    if (stock === 0) {

        statusHTML = `
            <span class="product-status status-out">
                Out of stock
            </span>
        `;

    } else if (isSale) {

        statusHTML = `
            <span class="product-status status-sale">
                Sale
            </span>
        `;

    } else {

        statusHTML = `
            <span class="product-status status-active">
                Active
            </span>
        `;
    }


    let imageHTML;

    if (image) {

        imageHTML = `
            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(name)}"
            >
        `;

    } else {

        imageHTML = "IMAGE";
    }


    return `
        <tr>

            <td>

                <div class="product-cell">

                    <div class="product-thumb">
                        ${imageHTML}
                    </div>

                    <div>
                        <div class="product-name">
                            ${escapeHtml(name)}
                        </div>

                        <div class="product-category">
                            ${escapeHtml(category)}
                        </div>
                    </div>

                </div>

            </td>


            <td>
                ${escapeHtml(category)}
            </td>


            <td class="product-price">
                ${priceHTML}
            </td>


            <td class="${stockClass}">
                ${stockText}
            </td>


            <td>
                ${statusHTML}
            </td>


            <td>

                <div class="product-actions">

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editProduct('${product.id}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="openDeleteModal('${product.id}')"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}).join("");

}

/* =========================
SEARCH + FILTER
========================= */

function filterProducts() {

const searchText =
    searchInput.value.trim().toLowerCase();

const selectedCategory =
    categoryFilter.value;


filteredProducts = products.filter((product) => {

    const name =
        String(product.name || "").toLowerCase();

    const category =
        String(product.category || "").toLowerCase();


    const matchesSearch =
        name.includes(searchText);


    const matchesCategory =
        selectedCategory === "all" ||
        category === selectedCategory.toLowerCase();


    return matchesSearch && matchesCategory;
});


displayProducts();

}

searchInput.addEventListener("input", filterProducts);

categoryFilter.addEventListener("change", filterProducts);

/* =========================
EDIT PRODUCT
========================= */

function editProduct(productId) {

window.location.href =
    `admin-add-product.html?id=${encodeURIComponent(productId)}`;

}

/* =========================
DELETE PRODUCT
========================= */

function openDeleteModal(productId) {

productToDelete = productId;

deleteModal.classList.add("open");

}

function closeDeleteModal() {

productToDelete = null;

deleteModal.classList.remove("open");

}

cancelDelete.addEventListener("click", closeDeleteModal);

deleteModal.addEventListener("click", (event) => {

if (event.target === deleteModal) {
    closeDeleteModal();
}

});

/* =========================
CONFIRM DELETE
========================= */

confirmDelete.addEventListener("click", async () => {

if (!productToDelete) {
    return;
}


confirmDelete.disabled = true;

confirmDelete.textContent = "Deleting...";


try {

    await db.collection("products")
        .doc(productToDelete)
        .delete();


    products = products.filter(
        product => product.id !== productToDelete
    );


    filteredProducts = filteredProducts.filter(
        product => product.id !== productToDelete
    );


    closeDeleteModal();

    displayProducts();

} catch (error) {

    console.error("Error deleting product:", error);

    alert("Could not delete the product. Please try again.");

} finally {

    confirmDelete.disabled = false;

    confirmDelete.textContent = "Delete";
}

});

/* =========================
ESCAPE HTML
========================= */

function escapeHtml(value) {

return String(value || "").replace(/[&<>"']/g, function(character) {

    return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character];

});

}

/* =========================
START
========================= */

loadProducts();