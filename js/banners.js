let promoBanners = [];
let currentPromoIndex = 0;
let promoTimer = null;

async function loadPromoBanners() {
  const bannerSection = document.querySelector(".promo-banner-section");

  try {
    const snapshot = await db
      .collection("banners")
      .where("active", "==", true)
      .get();

    promoBanners = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        return Number(a.order || 0) - Number(b.order || 0);
      });

    if (!promoBanners.length) {
      bannerSection.style.display = "none";
      return;
    }

    renderPromoBanners();

    if (promoBanners.length > 1) {
      startPromoAutoSlide();
    }
  } catch (error) {
    console.error("Failed to load promotional banners:", error);
    bannerSection.style.display = "none";
  }
}

function renderPromoBanners() {
  const bannerContainer = document.getElementById("promo-banner");
  const dotsContainer = document.getElementById("promo-dots");

  bannerContainer.innerHTML = promoBanners
    .map(
      (banner, index) => `
        <a
          href="${escapeBannerUrl(banner.link || "pages/shop.html")}"
          class="promo-slide ${index === 0 ? "active" : ""}"
        >
          <img
            src="${escapeHtml(banner.imageUrl || banner.image || "")}"
            alt="${escapeHtml(banner.title || "Promotion")}"
          />
        </a>
      `,
    )
    .join("");

  dotsContainer.innerHTML =
    promoBanners.length > 1
      ? promoBanners
          .map(
            (_, index) => `
              <button
                class="promo-dot ${index === 0 ? "active" : ""}"
                onclick="showPromoSlide(${index})"
                aria-label="Go to banner ${index + 1}"
              ></button>
            `,
          )
          .join("")
      : "";
}

function showPromoSlide(index) {
  if (!promoBanners.length) return;

  currentPromoIndex = index;

  document.querySelectorAll(".promo-slide").forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  document.querySelectorAll(".promo-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

function startPromoAutoSlide() {
  clearInterval(promoTimer);

  promoTimer = setInterval(() => {
    const nextIndex =
      (currentPromoIndex + 1) % promoBanners.length;

    showPromoSlide(nextIndex);
  }, 5000);
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function escapeBannerUrl(url) {
  const value = String(url || "").trim();

  if (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
  ) {
    return escapeHtml(value);
  }

  return "pages/shop.html";
}

loadPromoBanners();