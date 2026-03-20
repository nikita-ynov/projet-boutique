/* ==============================================
   ZAZA STORE – collections.js
   Page collections — chargement depuis l'API
   ============================================== */

let allProducts = [];
let currentFilter = 'all';
let currentSort = '';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  const queryParam = urlParams.get('q');

  if (typeParam) {
    currentFilter = typeParam;
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === typeParam);
    });
  }

  // Pré-remplir la barre de recherche si ?q= dans l'URL
  if (queryParam) {
    const searchInput = document.getElementById('search');
    if (searchInput) searchInput.value = queryParam;
  }

  await loadProducts();

  // Si recherche depuis URL, appliquer après chargement
  if (queryParam) renderFiltered(queryParam.toLowerCase());

  // Filtres chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      const q = document.getElementById('search')?.value.toLowerCase() || '';
      renderFiltered(q);
    });
  });

  // Tri
  document.getElementById('sort')?.addEventListener('change', e => {
    currentSort = e.target.value;
    const q = document.getElementById('search')?.value.toLowerCase() || '';
    renderFiltered(q);
  });

  // Recherche en temps réel sur la page collections
  document.getElementById('search')?.addEventListener('input', e => {
    currentFilter = 'all';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.filter-chip[data-filter="all"]')?.classList.add('active');
    renderFiltered(e.target.value.toLowerCase());
  });
});

async function loadProducts() {
  const grid = document.getElementById('products');
  grid.innerHTML = `
    <div class="products-loading">
      <div class="loading-spinner"></div>
      <p>Chargement des produits…</p>
    </div>`;

  try {
    allProducts = await ProductsAPI.getAll();
    renderFiltered();
  } catch (e) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="emoji">😕</div>
        <h3>Impossible de charger les produits</h3>
        <p>${e.message}</p>
      </div>`;
  }
}

function renderFiltered(search = '') {
  let products = [...allProducts];

  // Filtre par type
  if (currentFilter && currentFilter !== 'all') {
    products = products.filter(p => p.type && p.type.toLowerCase() === currentFilter.toLowerCase());
  }

  // Recherche texte
  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.type && p.type.toLowerCase().includes(search)) ||
      (p.description && p.description.toLowerCase().includes(search))
    );
  }

  // Tri
  if (currentSort === 'price-asc') {
    products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (currentSort === 'price-desc') {
    products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  const grid = document.getElementById('products');
  const countEl = document.getElementById('results-count');

  if (countEl) countEl.textContent = `${products.length} produit${products.length !== 1 ? 's' : ''}`;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🧸</div>
        <h3>Aucun produit trouvé</h3>
        <p>Essayez un autre filtre ou une autre recherche.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(renderProductCard).join('');
  attachCardEvents(grid);
}