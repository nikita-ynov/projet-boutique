/* ==============================================
   ZAZA STORE – index.js
   Page d'accueil — nouveaux arrivages depuis API
   ============================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('products-home');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--text-secondary)">
      <div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 1rem;"></div>
      <p>Chargement…</p>
    </div>`;

  try {
    const products = await ProductsAPI.getAll();
    const featured = products.slice(0, 4);

    if (!featured.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);grid-column:1/-1">Aucun produit disponible.</p>';
      return;
    }
    container.innerHTML = featured.map(renderProductCard).join('');
    attachCardEvents(container);
  } catch (e) {
    container.innerHTML = `<p style="color:var(--text-secondary);grid-column:1/-1">Impossible de charger les produits : ${e.message}</p>`;
  }
});