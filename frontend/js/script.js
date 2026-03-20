/* ==============================================
   ZAZA STORE – product.js
   Product detail page logic
   ============================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Get product ID from URL
  const params = new URLSearchParams(window.location.search);
  const productId = +(params.get("id") || 1);
  const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];

  /* ---- POPULATE PAGE ---- */
  document.title = `${product.name} – ZAZA STORE`;

  // Name + meta
  document.getElementById("productName").textContent = product.name;
  document.getElementById("productType").textContent = product.type;
  document.getElementById("productGender").textContent = "Unisexe";
  document.getElementById("productStock").textContent =
    product.stock > 5 ? `${product.stock} disponibles` : `Plus que ${product.stock} !`;
  document.getElementById("productStock").className =
    product.stock > 5 ? "stock-available" : "stock-low";

  // Rating
  document.getElementById("starsEl").textContent = renderStars(product.rating);
  document.getElementById("ratingCount").textContent = `(${product.reviewCount} avis)`;

  // Price
  const price = finalPrice(product);
  document.getElementById("priceCurrentEl").textContent = `${price}€`;
  document.getElementById("priceOldEl").textContent = product.discount ? `${product.price.toFixed(2)}€` : "";
  const discountEl = document.getElementById("priceDiscountEl");
  if (product.discount) {
    discountEl.textContent = `-${product.discount}%`;
    discountEl.style.display = "inline-flex";
  } else {
    discountEl.style.display = "none";
  }

  // Badge
  const badgeEl = document.getElementById("productBadge");
  if (product.tags.includes("bestseller")) {
    badgeEl.textContent = "⭐ Bestseller";
    badgeEl.style.display = "inline-flex";
  } else if (product.tags.includes("nouveauté")) {
    badgeEl.textContent = "✨ Nouveauté";
    badgeEl.style.display = "inline-flex";
  } else {
    badgeEl.style.display = "none";
  }

  // Description
  document.getElementById("productDesc").textContent = product.description;

  // Gallery
  const mainImg = document.getElementById("mainImage");
  mainImg.src = product.images[0];
  mainImg.alt = product.name;

  const thumbsContainer = document.getElementById("thumbsContainer");
  thumbsContainer.innerHTML = product.images.map((src, i) => `
    <img src="${src}" alt="${product.name} ${i + 1}" class="${i === 0 ? "active" : ""}" data-src="${src}">
  `).join("");

  thumbsContainer.querySelectorAll("img").forEach(img => {
    img.addEventListener("click", () => {
      mainImg.src = img.dataset.src;
      thumbsContainer.querySelectorAll("img").forEach(t => t.classList.remove("active"));
      img.classList.add("active");
    });
  });

  /* ---- COLORS ---- */
  const colorsEl = document.getElementById("colorsEl");
  let selectedColor = product.colors[0] || null;

  colorsEl.innerHTML = product.colors.map((c, i) => `
    <button class="color-swatch ${i === 0 ? "active" : ""}" style="background:${c}" data-color="${c}" title="${c}"></button>
  `).join("");

  colorsEl.querySelectorAll(".color-swatch").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedColor = btn.dataset.color;
      colorsEl.querySelectorAll(".color-swatch").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* ---- SIZES ---- */
  const sizesEl = document.getElementById("sizesEl");
  let selectedSize = product.sizes[1] || product.sizes[0];

  sizesEl.innerHTML = product.sizes.map((s, i) => `
    <button class="size-btn ${i === 1 ? "active" : ""}" data-size="${s}">${s}</button>
  `).join("");

  sizesEl.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      sizesEl.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* ---- QUANTITY ---- */
  let qty = 1;
  const qtyEl = document.getElementById("qtyValue");

  document.getElementById("qtyMinus").addEventListener("click", () => {
    if (qty > 1) { qty--; qtyEl.textContent = qty; }
  });

  document.getElementById("qtyPlus").addEventListener("click", () => {
    if (qty < product.stock) { qty++; qtyEl.textContent = qty; }
  });

  /* ---- DESCRIPTION TOGGLE ---- */
  const descEl = document.getElementById("productDesc");
  const toggleDescBtn = document.getElementById("toggleDesc");
  let descExpanded = false;

  toggleDescBtn.addEventListener("click", () => {
    descExpanded = !descExpanded;
    descEl.classList.toggle("expanded", descExpanded);
    toggleDescBtn.textContent = descExpanded ? "Voir moins ↑" : "Voir plus ↓";
  });

  /* ---- ADD TO CART ---- */
  document.getElementById("btnAddToCart").addEventListener("click", () => {
    addToCart(product.id, qty, selectedSize, selectedColor);
  });

  /* ---- WISHLIST ---- */
  const wishlistBtn = document.getElementById("btnWishlist");
  let inWishlist = wishlist.includes(product.id);
  wishlistBtn.textContent = inWishlist ? "❤️" : "🤍";

  wishlistBtn.addEventListener("click", () => {
    inWishlist = toggleWishlist(product.id);
    wishlistBtn.textContent = inWishlist ? "❤️" : "🤍";
  });

  /* ---- SIMILAR PRODUCTS ---- */
  const similar = PRODUCTS.filter(p => p.id !== product.id && p.type === product.type).slice(0, 3);
  const fallback = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);
  const similarList = similar.length >= 2 ? similar : fallback;

  const similarGrid = document.getElementById("similarGrid");
  similarGrid.innerHTML = similarList.map(renderProductCard).join("");
  attachCardEvents(similarGrid);
});