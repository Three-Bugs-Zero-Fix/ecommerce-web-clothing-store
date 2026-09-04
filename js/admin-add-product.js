const form = document.getElementById("product-form");

const nameInput = document.getElementById("product-name");
const descriptionInput = document.getElementById("product-description");
const categoryInput = document.getElementById("product-category");
const priceInput = document.getElementById("product-price");
const colorsInput = document.getElementById("product-colors");
const stockInput = document.getElementById("product-stock");
const imagesInput = document.getElementById("product-images");

const featuredInput = document.getElementById("product-featured");
const saleInput = document.getElementById("product-sale");
const salePriceInput = document.getElementById("product-sale-price");
const salePriceGroup = document.getElementById("sale-price-group");

const saveButton = document.getElementById("save-product-btn");

const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");


// ========================================
// EDIT MODE
// ========================================

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

let editMode = false;


// ========================================
// PAGE ELEMENTS
// ========================================

const pageTitle = document.querySelector(".page-header h1");
const pageDescription = document.querySelector(".page-description");
const adminTitle = document.querySelector(".admin-title");


// ========================================
// SALE PRICE
// ========================================

saleInput.addEventListener("change", function () {

    if (saleInput.checked) {

        salePriceGroup.style.display = "block";
        salePriceInput.required = true;

    } else {

        salePriceGroup.style.display = "none";
        salePriceInput.required = false;
        salePriceInput.value = "";

    }

});


// ========================================
// GET SELECTED SIZES
// ========================================

function getSelectedSizes() {

    const checkedSizes = document.querySelectorAll(
        'input[name="sizes"]:checked'
    );

    return Array.from(checkedSizes).map(function (checkbox) {
        return checkbox.value;
    });

}


// ========================================
// GET COLORS
// ========================================

function getColors() {

    return colorsInput.value
        .split(",")
        .map(function (color) {
            return color.trim();
        })
        .filter(function (color) {
            return color !== "";
        });

}


// ========================================
// GET IMAGES
// ========================================

function getImages() {

    return imagesInput.value
        .split("\n")
        .map(function (image) {
            return image.trim();
        })
        .filter(function (image) {
            return image !== "";
        });

}


// ========================================
// SHOW ERROR
// ========================================

function showError(message) {

    errorMessage.textContent = message;
    errorMessage.style.display = "block";

    successMessage.style.display = "none";

}


// ========================================
// SHOW SUCCESS
// ========================================

function showSuccess(message) {

    successMessage.textContent = message;
    successMessage.style.display = "block";

    errorMessage.style.display = "none";

}


// ========================================
// LOAD PRODUCT FOR EDITING
// ========================================

async function loadProductForEdit() {

    if (!productId) {
        return;
    }

    editMode = true;

    saveButton.disabled = true;
    saveButton.textContent = "Loading Product...";

    try {

        const doc = await db
            .collection("products")
            .doc(productId)
            .get();

        if (!doc.exists) {

            showError("Product not found.");

            saveButton.disabled = true;

            return;
        }

        const product = doc.data();


        // -----------------------------
        // PAGE TEXT
        // -----------------------------

        pageTitle.textContent = "Edit Product";

        pageDescription.textContent =
            "Update the information of this product.";

        adminTitle.textContent = "Edit Product";


        // -----------------------------
        // BASIC INFORMATION
        // -----------------------------

        nameInput.value = product.name || "";

        descriptionInput.value =
            product.description || "";

        categoryInput.value =
            product.category || "";

        priceInput.value =
            product.price ?? "";

        stockInput.value =
            product.stock ?? "";


        // -----------------------------
        // COLORS
        // -----------------------------

        if (Array.isArray(product.colors)) {

            colorsInput.value =
                product.colors.join(", ");

        } else {

            colorsInput.value = "";

        }


        // -----------------------------
        // IMAGES
        // -----------------------------

        if (Array.isArray(product.images)) {

            imagesInput.value =
                product.images.join("\n");

        } else {

            imagesInput.value = "";

        }


        // -----------------------------
        // SIZES
        // -----------------------------

        const sizes = Array.isArray(product.sizes)
            ? product.sizes
            : [];

        const sizeCheckboxes =
            document.querySelectorAll('input[name="sizes"]');

        sizeCheckboxes.forEach(function (checkbox) {

            checkbox.checked =
                sizes.includes(checkbox.value);

        });


        // -----------------------------
        // FEATURED
        // -----------------------------

        featuredInput.checked =
            product.featured === true;


        // -----------------------------
        // SALE
        // -----------------------------

        saleInput.checked =
            product.sale === true;

        if (product.sale === true) {

            salePriceGroup.style.display = "block";

            salePriceInput.required = true;

            salePriceInput.value =
                product.salePrice ?? "";

        } else {

            salePriceGroup.style.display = "none";

            salePriceInput.required = false;

            salePriceInput.value = "";

        }


        // -----------------------------
        // READY
        // -----------------------------

        saveButton.disabled = false;

        saveButton.textContent = "Update Product";

    } catch (error) {

        console.error("Error loading product:", error);

        showError(
            "Failed to load product. Please try again."
        );

        saveButton.disabled = true;

    }

}


// ========================================
// FORM SUBMIT
// ========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    errorMessage.style.display = "none";
    successMessage.style.display = "none";


    const name =
        nameInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const category =
        categoryInput.value;

    const price =
        Number(priceInput.value);

    const stock =
        Number(stockInput.value);

    const sizes =
        getSelectedSizes();

    const colors =
        getColors();

    const images =
        getImages();

    const featured =
        featuredInput.checked;

    const sale =
        saleInput.checked;

    const salePrice =
        sale ? Number(salePriceInput.value) : null;


    // ========================================
    // VALIDATION
    // ========================================

    if (!name) {

        showError("Please enter a product name.");
        return;

    }


    if (!description) {

        showError("Please enter a product description.");
        return;

    }


    if (!category) {

        showError("Please select a category.");
        return;

    }


    if (isNaN(price) || price < 0) {

        showError("Please enter a valid price.");
        return;

    }


    if (isNaN(stock) || stock < 0) {

        showError("Please enter a valid stock quantity.");
        return;

    }


    if (sizes.length === 0) {

        showError("Please select at least one size.");
        return;

    }


    if (colors.length === 0) {

        showError("Please enter at least one color.");
        return;

    }


    if (images.length === 0) {

        showError("Please add at least one product image URL.");
        return;

    }


    if (sale) {

        if (isNaN(salePrice) || salePrice < 0) {

            showError("Please enter a valid sale price.");
            return;

        }


        if (salePrice >= price) {

            showError(
                "Sale price must be lower than the regular price."
            );

            return;

        }

    }


    // ========================================
    // BUTTON LOADING
    // ========================================

    saveButton.disabled = true;

    saveButton.textContent =
        editMode
            ? "Updating Product..."
            : "Adding Product...";


    try {

        // ========================================
        // PRODUCT DATA
        // ========================================

        const productData = {

            name: name,

            description: description,

            price: price,

            category: category,

            images: images,

            sizes: sizes,

            colors: colors,

            stock: stock,

            featured: featured,

            sale: sale,

            salePrice: sale
                ? salePrice
                : null

        };


        // ========================================
        // UPDATE EXISTING PRODUCT
        // ========================================

        if (editMode) {

            await db
                .collection("products")
                .doc(productId)
                .update(productData);


            showSuccess(
                "Product updated successfully."
            );

        }


        // ========================================
        // ADD NEW PRODUCT
        // ========================================

        else {

            productData.createdAt =
                firebase.firestore.FieldValue.serverTimestamp();


            await db
                .collection("products")
                .add(productData);


            showSuccess(
                "Product added successfully."
            );

        }


        // ========================================
        // REDIRECT
        // ========================================

        setTimeout(function () {

            window.location.href =
                "admin-products.html";

        }, 1000);


    } catch (error) {

        console.error(
            "Error saving product:",
            error
        );


        showError(
            editMode
                ? "Failed to update product. Please try again."
                : "Failed to add product. Please try again."
        );


        saveButton.disabled = false;

        saveButton.textContent =
            editMode
                ? "Update Product"
                : "Add Product";

    }

});


// ========================================
// START
// ========================================

loadProductForEdit();