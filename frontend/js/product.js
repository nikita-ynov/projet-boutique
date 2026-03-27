/* ==============================================
   ZAZA STORE – product.js
   Page produit — chargement depuis l'API
   ============================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) { window.location.href = './collections.html'; return; }

  try {
    const [product, similar] = await Promise.all([
      ProductsAPI.getById(productId),
      ProductsAPI.getSimilar(productId).catch(() => [])
    ]);

    populatePage(product);
    renderSimilar(similar);

    if (Auth.isLoggedIn()) {
      try {
        const favs = await FavoritesAPI.get();
        const isFav = favs.some(f => f.id === product.id);
        const wb = document.getElementById('btnWishlist');
        if (wb) wb.textContent = isFav ? '❤️' : '🤍';
      } catch {}
    }
  } catch (e) {
    const pp = document.querySelector('.product-page');
    if (pp) pp.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:5rem 0;color:var(--text-secondary)">
        <div style="font-size:3rem;margin-bottom:1rem">😕</div>
        <h3>Produit introuvable</h3>
        <p style="margin-top:.5rem">${e.message}</p>
        <a href="./collections.html" class="btn" style="margin-top:2rem;display:inline-flex">← Retour aux collections</a>
      </div>`;
  }
});

function populatePage(p) {
  const images = getProductImages(p);
  if (!images.length) images.push('https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=800&q=80');

  document.title = `${p.name} – ZAZA STORE`;
  document.querySelectorAll('#productName').forEach(el => el.textContent = p.name);

  // ── CAROUSEL ──────────────────────────────────
  let currentImg = 0;
  const mainImg = document.getElementById('mainImage');
  const thumbsContainer = document.getElementById('thumbsContainer');
  const mainImageEl = document.querySelector('.main-image');

  function goTo(idx) {
    currentImg = (idx + images.length) % images.length;
    if (mainImg) { mainImg.src = images[currentImg]; mainImg.alt = p.name; }
    if (thumbsContainer) thumbsContainer.querySelectorAll('img').forEach((t, i) => t.classList.toggle('active', i === currentImg));
    const counter = document.getElementById('img-counter');
    if (counter) counter.textContent = `${currentImg + 1} / ${images.length}`;
  }

  if (mainImg) { mainImg.src = images[0]; mainImg.alt = p.name; }

  if (mainImageEl && images.length > 1) {
    mainImageEl.style.position = 'relative';

    const arrowBase = 'position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:rgba(13,13,13,.75);border:1px solid rgba(245,240,235,.15);color:var(--text-primary);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1.3rem;display:flex;align-items:center;justify-content:center;transition:.2s;backdrop-filter:blur(6px);line-height:1;';
    const prevBtn = document.createElement('button');
    const nextBtn = document.createElement('button');
    prevBtn.style.cssText = arrowBase + 'left:12px;';
    nextBtn.style.cssText = arrowBase + 'right:12px;';
    prevBtn.innerHTML = '‹';
    nextBtn.innerHTML = '›';
    prevBtn.onclick = () => goTo(currentImg - 1);
    nextBtn.onclick = () => goTo(currentImg + 1);
    mainImageEl.appendChild(prevBtn);
    mainImageEl.appendChild(nextBtn);

    const counter = document.createElement('div');
    counter.id = 'img-counter';
    counter.style.cssText = 'position:absolute;bottom:12px;right:14px;background:rgba(0,0,0,.65);color:white;font-size:.72rem;padding:3px 9px;border-radius:20px;z-index:10;';
    counter.textContent = `1 / ${images.length}`;
    mainImageEl.appendChild(counter);

    // Swipe mobile
    let startX = 0;
    mainImageEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    mainImageEl.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? currentImg + 1 : currentImg - 1);
    });

    // Flèches clavier
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') goTo(currentImg - 1);
      if (e.key === 'ArrowRight') goTo(currentImg + 1);
    });
  }

  // Thumbnails
  if (thumbsContainer) {
    thumbsContainer.innerHTML = images.map((src, i) => `
      <img src="${src}" alt="${p.name} ${i+1}" class="${i===0?'active':''}" loading="lazy">
    `).join('');
    thumbsContainer.querySelectorAll('img').forEach((img, i) => img.addEventListener('click', () => goTo(i)));
  }

  // ── PRIX ──────────────────────────────────────
  const fp = calcFinalPrice(p.price, p.discount);
  const priceEl = document.getElementById('priceCurrentEl');
  const oldEl   = document.getElementById('priceOldEl');
  const discEl  = document.getElementById('priceDiscountEl');
  if (priceEl) priceEl.textContent = `${fp} €`;
  if (oldEl)   oldEl.textContent   = p.discount ? `${parseFloat(p.price).toFixed(2)} €` : '';
  if (discEl) {
    if (p.discount) { discEl.textContent = `-${p.discount}%`; discEl.style.display = 'inline-flex'; }
    else discEl.style.display = 'none';
  }

  const badge = document.getElementById('productBadge');
  if (badge) {
    if (p.discount > 0) { badge.textContent = `🔥 -${p.discount}%`; badge.style.display = 'inline-flex'; }
    else badge.style.display = 'none';
  }

  // ── DESCRIPTION tronquée à 150 caractères ─────
  const descEl    = document.getElementById('productDesc');
  const toggleBtn = document.getElementById('toggleDesc');
  const fullDesc  = p.description || '—';
  const TRUNC     = 150;

  if (descEl) {
    if (fullDesc.length <= TRUNC) {
      descEl.textContent = fullDesc;
      if (toggleBtn) toggleBtn.style.display = 'none';
    } else {
      descEl.textContent = fullDesc.slice(0, TRUNC) + '…';
      let expanded = false;
      toggleBtn?.addEventListener('click', () => {
        expanded = !expanded;
        descEl.textContent = expanded ? fullDesc : fullDesc.slice(0, TRUNC) + '…';
        if (toggleBtn) toggleBtn.textContent = expanded ? 'Voir moins ↑' : 'Voir plus ↓';
      });
    }
  }

  // ── META ──────────────────────────────────────
  const starsEl  = document.getElementById('starsEl');
  const ratingEl = document.getElementById('ratingCount');
  if (starsEl)  starsEl.textContent  = '★★★★★';
  if (ratingEl) ratingEl.textContent = '(0 avis)';

  const typeEl   = document.getElementById('productType');
  const genderEl = document.getElementById('productGender');
  const stockEl  = document.getElementById('productStock');
  if (typeEl)   typeEl.textContent   = p.type   || '—';
  if (genderEl) genderEl.textContent = p.gender || 'Unisexe';
  if (stockEl) {
    stockEl.textContent = p.stock > 5 ? `${p.stock} disponibles` : p.stock > 0 ? `Plus que ${p.stock} !` : 'Rupture de stock';
    stockEl.className   = p.stock > 5 ? 'stock-available' : p.stock > 0 ? 'stock-low' : '';
    if (p.stock === 0) stockEl.style.color = 'var(--accent)';
  }

  // ── COULEURS ──────────────────────────────────
  // Dictionnaire nom → valeur CSS
  const COLOR_MAP = {
    // Français
    rouge: '#e8341a', red: '#e8341a',
    bleu: '#3b82f6', blue: '#3b82f6',
    'bleu clair': '#93c5fd', 'bleu marine': '#1e3a5f', navy: '#1e3a5f',
    vert: '#22c55e', green: '#22c55e', 'vert forêt': '#15803d',
    jaune: '#fbbf24', yellow: '#fbbf24',
    orange: '#f97316',
    rose: '#f472b6', pink: '#f472b6', 'rose pâle': '#fce7f3',
    violet: '#a855f7', purple: '#a855f7', mauve: '#c084fc',
    noir: '#1a1a1a', black: '#1a1a1a',
    blanc: '#f5f5f5', white: '#f5f5f5',
    gris: '#9ca3af', grey: '#9ca3af', gray: '#9ca3af',
    marron: '#92400e', brown: '#92400e', beige: '#d4b896',
    crème: '#fef9c3', cream: '#fef9c3',
    turquoise: '#2dd4bf', cyan: '#22d3ee',
    or: '#f59e0b', gold: '#f59e0b', argent: '#cbd5e1', silver: '#cbd5e1',
    lavande: '#c4b5fd', lavender: '#c4b5fd',
    corail: '#fb7185', coral: '#fb7185',
    saumon: '#fca5a5', salmon: '#fca5a5',
  };

  function resolveColor(raw) {
    const key = raw.toLowerCase().trim();
    // Si déjà une valeur CSS valide (#hex, rgb, hsl, nom CSS standard)
    if (key.startsWith('#') || key.startsWith('rgb') || key.startsWith('hsl')) return raw;
    return COLOR_MAP[key] || raw;
  }

  const colorsEl   = document.getElementById('colorsEl');
  const colorsList = Array.isArray(p.colors) ? p.colors
    : (typeof p.colors === 'string' ? p.colors.split(',').map(c => c.trim()).filter(Boolean) : []);
  let selectedColor = colorsList[0] || null;

  // Label qui affiche le nom de la couleur sélectionnée
  const colorLabelEl = document.querySelector('.color-label');

  if (colorsEl) {
    if (colorsList.length) {
      colorsEl.innerHTML = colorsList.map((c, i) => {
        const cssColor = resolveColor(c);
        const isDark = isColorDark(cssColor);
        return `<button
          class="color-swatch ${i===0?'active':''}"
          style="background:${cssColor};border-color:${isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}"
          data-color="${c}"
          data-css="${cssColor}"
          title="${c}">
        </button>`;
      }).join('');

      if (colorLabelEl) colorLabelEl.textContent = colorsList[0];

      colorsEl.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedColor = btn.dataset.color;
          colorsEl.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (colorLabelEl) colorLabelEl.textContent = btn.dataset.color;
        });
      });
    } else {
      colorsEl.innerHTML = '<span style="color:var(--text-muted);font-size:.85rem">Non spécifié</span>';
    }
  }

  // Détecte si une couleur est sombre (pour adapter la bordure)
  function isColorDark(hex) {
    if (!hex || !hex.startsWith('#')) return false;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return (r*299 + g*587 + b*114) / 1000 < 128;
  }

  // ── TAILLES ───────────────────────────────────
  const sizesEl   = document.getElementById('sizesEl');
  const sizesList = Array.isArray(p.sizes) ? p.sizes
    : (typeof p.sizes === 'string' ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : []);
  let selectedSize = sizesList[0] || null;

  if (sizesEl) {
    if (sizesList.length) {
      sizesEl.innerHTML = sizesList.map((s, i) => `
        <button class="size-btn ${i===0?'active':''}" data-size="${s}">${s}</button>
      `).join('');
      sizesEl.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedSize = btn.dataset.size;
          sizesEl.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    } else {
      sizesEl.innerHTML = '<span style="color:var(--text-muted);font-size:.85rem">Taille unique</span>';
    }
  }

  // ── QUANTITÉ ──────────────────────────────────
  let qty = 1;
  const qtyEl = document.getElementById('qtyValue');
  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    if (qty > 1) { qty--; if (qtyEl) qtyEl.textContent = qty; }
  });
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    if (p.stock === 0 || qty >= p.stock) return;
    qty++; if (qtyEl) qtyEl.textContent = qty;
  });

  // ── AJOUTER AU PANIER ─────────────────────────
  const cartBtn = document.getElementById('btnAddToCart');
  if (cartBtn) {
    if (p.stock === 0) {
      cartBtn.textContent = '❌ Rupture de stock';
      cartBtn.disabled = true;
      cartBtn.style.opacity = '.5';
    } else {
      cartBtn.addEventListener('click', async () => {
        if (!Auth.isLoggedIn()) { showAuthModal(); return; }
        cartBtn.textContent = '⏳ Ajout…';
        cartBtn.disabled = true;
        try {
          await CartAPI.add(p.id, qty);
          showToast(`${p.name} ajouté au panier 🛒`);
          await updateCartCount();
          cartBtn.textContent = '✅ Ajouté !';
          setTimeout(() => { cartBtn.textContent = '🛒 Ajouter au panier'; cartBtn.disabled = false; }, 2000);
        } catch (err) {
          showToast(err.message, 'error');
          cartBtn.textContent = '🛒 Ajouter au panier';
          cartBtn.disabled = false;
        }
      });
    }
  }

  // ── FAVORIS ───────────────────────────────────
  const wishlistBtn = document.getElementById('btnWishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) { showAuthModal(); return; }
      try {
        await FavoritesAPI.add(p.id);
        wishlistBtn.textContent = '❤️';
        showToast('Ajouté aux favoris ❤️');
      } catch (err) {
        if (err.message === 'Déjà en favoris') {
          await FavoritesAPI.remove(p.id);
          wishlistBtn.textContent = '🤍';
          showToast('Retiré des favoris');
        } else { showToast(err.message, 'error'); }
      }
    });
  }
}

function renderSimilar(products) {
  const grid = document.getElementById('similarGrid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = '<p style="color:var(--text-secondary)">Aucun produit similaire.</p>';
    return;
  }
  grid.innerHTML = products.map(renderProductCard).join('');
  attachCardEvents(grid);
}