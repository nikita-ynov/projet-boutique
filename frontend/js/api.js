/* ==============================================
   ZAZA STORE – api.js
   Base API, Auth, Cart drawer, Modales, Toast
   ============================================== */

const API_URL = 'http://localhost:3000';

// ══════════════════════════════════════════════
//  TOKEN / SESSION
// ══════════════════════════════════════════════
const Auth = {
  getToken()      { return localStorage.getItem('zaza_token'); },
  setToken(t)     { localStorage.setItem('zaza_token', t); },
  removeToken()   { localStorage.removeItem('zaza_token'); },
  isLoggedIn()    { return !!localStorage.getItem('zaza_token'); },
};

// ══════════════════════════════════════════════
//  FETCH DE BASE
// ══════════════════════════════════════════════
async function request(path, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (!token) throw new Error('Non connecté');
    headers['Authorization'] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Erreur serveur');
  return data;
}

// ══════════════════════════════════════════════
//  AUTH API
// ══════════════════════════════════════════════
const AuthAPI = {
  async register(email, password) {
    const data = await request('/auth/register', 'POST', { email, password });
    if (data.token) Auth.setToken(data.token);
    return data;
  },
  async login(email, password) {
    const data = await request('/auth/login', 'POST', { email, password });
    if (data.token) Auth.setToken(data.token);
    return data;
  },
  async getProfile() {
    return request('/auth/me', 'GET', null, true);
  },
  logout() { Auth.removeToken(); },
};

// ══════════════════════════════════════════════
//  PRODUCTS API
// ══════════════════════════════════════════════
const ProductsAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString() ? `?${params}` : '';
    return request(`/products${qs}`);
  },
  async getById(id)     { return request(`/products/${id}`); },
  async getSimilar(id)  { return request(`/products/${id}/similar`); },
};

// ══════════════════════════════════════════════
//  CART API
// ══════════════════════════════════════════════
const CartAPI = {
  async get()                        { return request('/cart', 'GET', null, true); },
  async add(productId, quantity = 1) { return request('/cart', 'POST', { productId, quantity }, true); },
  async updateQuantity(productId, quantity) { return request('/cart', 'PUT', { productId, quantity }, true); },
  async removeProduct(productId)     { return request(`/cart/${productId}`, 'DELETE', null, true); },
  async clear()                      { return request('/cart', 'DELETE', null, true); },
};

// ══════════════════════════════════════════════
//  FAVORITES API
// ══════════════════════════════════════════════
const FavoritesAPI = {
  async get()             { return request('/favorites', 'GET', null, true); },
  async add(productId)    { return request(`/favorites/${productId}`, 'POST', null, true); },
  async remove(productId) { return request(`/favorites/${productId}`, 'DELETE', null, true); },
};

// ══════════════════════════════════════════════
//  HELPERS PRIX / RENDU
// ══════════════════════════════════════════════
function calcFinalPrice(price, discount) {
  if (!discount || discount === 0) return parseFloat(price).toFixed(2);
  return (price * (1 - discount / 100)).toFixed(2);
}

function getProductImages(p) {
  if (Array.isArray(p.images)) return p.images.map(i => typeof i === 'string' ? i : i.image_url);
  if (typeof p.images === 'string' && p.images) return p.images.split(',').map(s => s.trim());
  return [];
}

function renderProductCard(p) {
  const images = getProductImages(p);
  const img1 = images[0] || 'https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=400&q=80';
  const img2 = images[1] || img1;
  const fp   = calcFinalPrice(p.price, p.discount);
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image">
        ${p.discount ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
        <img src="${img1}" alt="${p.name}" class="first" loading="lazy">
        <img src="${img2}" alt="${p.name}" class="second" loading="lazy">
        <button class="wishlist-btn" data-id="${p.id}" title="Favoris">🤍</button>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span>${fp} ${p.currency || 'EUR'}</span>
          ${p.discount ? `<span class="old-price">${parseFloat(p.price).toFixed(2)} €</span>` : ''}
        </div>
      </div>
    </div>`;
}

function attachCardEvents(container) {
  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.wishlist-btn')) return;
      window.location.href = `./productId.html?id=${card.dataset.id}`;
    });
    const wb = card.querySelector('.wishlist-btn');
    if (wb) wb.addEventListener('click', async e => {
      e.stopPropagation();
      if (!Auth.isLoggedIn()) { showAuthModal(); return; }
      const id = +card.dataset.id;
      try {
        await FavoritesAPI.add(id);
        wb.textContent = '❤️';
        showToast('Ajouté aux favoris ❤️');
      } catch (err) {
        if (err.message === 'Déjà en favoris') {
          await FavoritesAPI.remove(id);
          wb.textContent = '🤍';
          showToast('Retiré des favoris');
        } else { showToast(err.message, 'error'); }
      }
    });
  });
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function showToast(message, type = 'success') {
  let c = document.getElementById('zaza-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'zaza-toasts';
    c.style.cssText = 'position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:9999;pointer-events:none;';
    document.body.appendChild(c);
  }
  const el = document.createElement('div');
  const color = type === 'error' ? 'rgba(232,52,26,.5)' : type === 'warning' ? 'rgba(249,199,79,.3)' : 'rgba(245,240,235,.12)';
  el.style.cssText = `background:var(--bg-card);border:1px solid ${color};color:var(--text-primary);padding:12px 18px;border-radius:10px;font-size:13.5px;font-family:var(--font-body);backdrop-filter:blur(12px);animation:toastIn .2s ease;pointer-events:all;min-width:220px;`;
  el.textContent = message;
  if (!document.getElementById('zaza-toast-style')) {
    const s = document.createElement('style');
    s.id = 'zaza-toast-style';
    s.textContent = '@keyframes toastIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(s);
  }
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ══════════════════════════════════════════════
//  CART DRAWER
// ══════════════════════════════════════════════
function injectCartDrawerStyles() {
  if (document.getElementById('cart-drawer-style')) return;
  const s = document.createElement('style');
  s.id = 'cart-drawer-style';
  s.textContent = `
    .cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;opacity:0;pointer-events:none;transition:.3s;backdrop-filter:blur(2px);}
    .cart-overlay.open{opacity:1;pointer-events:all;}
    .cart-drawer{position:fixed;top:0;right:0;height:100%;width:420px;max-width:95vw;background:var(--bg-card);border-left:1px solid var(--border);z-index:501;transform:translateX(100%);transition:.35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}
    .cart-drawer.open{transform:translateX(0);}
    .cart-drawer-head{padding:24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .cart-drawer-head h3{font-size:1.1rem;font-weight:600;}
    .cart-close{background:none;border:none;color:var(--text-secondary);font-size:1.4rem;cursor:pointer;line-height:1;}
    .cart-close:hover{color:var(--text-primary);}
    .cart-items{flex:1;overflow-y:auto;padding:16px;}
    .cart-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);}
    .cart-item img{width:72px;height:96px;object-fit:cover;border-radius:8px;flex-shrink:0;}
    .cart-item-info{flex:1;display:flex;flex-direction:column;gap:4px;}
    .cart-item-name{font-size:.9rem;font-weight:500;}
    .cart-item-price{font-size:.85rem;color:var(--text-secondary);}
    .cart-item-qty{display:flex;align-items:center;gap:8px;margin-top:6px;}
    .cqty-btn{width:28px;height:28px;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);border-radius:6px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;}
    .cqty-btn:hover{border-color:var(--border-strong);}
    .cqty-val{font-size:.9rem;font-weight:600;min-width:20px;text-align:center;}
    .cart-item-remove{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.85rem;margin-top:auto;text-align:left;padding:0;}
    .cart-item-remove:hover{color:var(--accent);}
    .cart-empty{text-align:center;padding:4rem 0;color:var(--text-secondary);}
    .cart-empty .e-icon{font-size:3rem;margin-bottom:1rem;}
    .cart-footer{padding:20px 24px;border-top:1px solid var(--border);}
    .cart-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-weight:600;font-size:1rem;}
    .cart-total span:last-child{font-family:var(--font-display);font-size:1.3rem;}
    .cart-checkout-btn{width:100%;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);padding:14px;font-size:.95rem;font-weight:600;cursor:pointer;transition:var(--transition);}
    .cart-checkout-btn:hover{background:var(--accent-hover);}
    .cart-clear-btn{width:100%;background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:var(--radius-sm);padding:10px;font-size:.85rem;cursor:pointer;margin-top:8px;transition:var(--transition);}
    .cart-clear-btn:hover{border-color:var(--border-strong);color:var(--text-primary);}
  `;
  document.head.appendChild(s);
}

function createCartDrawer() {
  injectCartDrawerStyles();
  if (document.getElementById('cart-drawer')) return;
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'cart-overlay';
  overlay.onclick = closeCart;

  const drawer = document.createElement('div');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart-drawer';
  drawer.innerHTML = `
    <div class="cart-drawer-head">
      <h3>🛒 Mon panier</h3>
      <button class="cart-close" onclick="closeCart()">✕</button>
    </div>
    <div class="cart-items" id="cart-items-list"></div>
    <div class="cart-footer" id="cart-footer" style="display:none">
      <div class="cart-total"><span>Total</span><span id="cart-total-price">0.00 €</span></div>
      <button class="cart-checkout-btn">✅ Passer la commande</button>
      <button class="cart-clear-btn" onclick="clearCartAction()">🗑️ Vider le panier</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

async function openCart() {
  if (!Auth.isLoggedIn()) { showAuthModal(); return; }
  createCartDrawer();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  await renderCartItems();
}

function closeCart() {
  const o = document.getElementById('cart-overlay');
  const d = document.getElementById('cart-drawer');
  if (o) o.classList.remove('open');
  if (d) d.classList.remove('open');
  document.body.style.overflow = '';
}

async function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">Chargement…</div>';
  try {
    const items = await CartAPI.get();
    if (!items.length) {
      list.innerHTML = `<div class="cart-empty"><div class="e-icon">🛒</div><p>Votre panier est vide</p></div>`;
      footer.style.display = 'none';
      return;
    }
    let total = 0;
    list.innerHTML = items.map(item => {
      const fp = calcFinalPrice(item.price, item.discount);
      const lineTotal = (parseFloat(fp) * item.quantity).toFixed(2);
      total += parseFloat(lineTotal);
      return `
        <div class="cart-item" data-pid="${item.product_id}">
          <img src="https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=150&q=70" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${fp} ${item.discount ? `<s style="color:var(--text-muted);font-size:.8rem">${parseFloat(item.price).toFixed(2)}</s>` : ''} €</div>
            <div class="cart-item-qty">
              <button class="cqty-btn" onclick="changeQty(${item.product_id}, ${item.quantity - 1})">−</button>
              <span class="cqty-val">${item.quantity}</span>
              <button class="cqty-btn" onclick="changeQty(${item.product_id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.product_id})">Supprimer</button>
          </div>
        </div>`;
    }).join('');
    document.getElementById('cart-total-price').textContent = `${total.toFixed(2)} €`;
    footer.style.display = 'block';
  } catch (e) {
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--accent)">${e.message}</div>`;
  }
}

async function changeQty(productId, newQty) {
  if (newQty < 1) { await removeFromCart(productId); return; }
  try {
    await CartAPI.updateQuantity(productId, newQty);
    await renderCartItems();
    await updateCartCount();
  } catch (e) { showToast(e.message, 'error'); }
}

async function removeFromCart(productId) {
  try {
    await CartAPI.removeProduct(productId);
    await renderCartItems();
    await updateCartCount();
    showToast('Produit supprimé du panier');
  } catch (e) { showToast(e.message, 'error'); }
}

async function clearCartAction() {
  if (!confirm('Vider le panier ?')) return;
  try {
    await CartAPI.clear();
    await renderCartItems();
    await updateCartCount();
    showToast('Panier vidé 🧹');
  } catch (e) { showToast(e.message, 'error'); }
}

async function updateCartCount() {
  const badges = document.querySelectorAll('.cart-count');
  if (!Auth.isLoggedIn()) { badges.forEach(b => b.style.display = 'none'); return; }
  try {
    const items = await CartAPI.get();
    const total = items.reduce((s, i) => s + i.quantity, 0);
    badges.forEach(b => { b.textContent = total; b.style.display = total > 0 ? 'flex' : 'none'; });
  } catch { badges.forEach(b => b.style.display = 'none'); }
}

// ══════════════════════════════════════════════
//  AUTH MODAL (login + register tabs)
// ══════════════════════════════════════════════
function showAuthModal(defaultTab = 'login') {
  if (document.getElementById('zaza-auth-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'zaza-auth-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);';

  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:36px;width:400px;max-width:95vw;">
      <div style="display:flex;gap:0;margin-bottom:28px;background:var(--bg-elevated);border-radius:10px;padding:4px;">
        <button id="tab-login" onclick="switchAuthTab('login')" style="flex:1;padding:9px;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer;transition:.2s;background:var(--accent);color:white;">Se connecter</button>
        <button id="tab-register" onclick="switchAuthTab('register')" style="flex:1;padding:9px;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer;transition:.2s;background:transparent;color:var(--text-secondary);">S'inscrire</button>
      </div>

      <!-- LOGIN -->
      <div id="form-login">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <input id="l-email" type="email" placeholder="Email" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text-primary);font-size:.95rem;width:100%;transition:.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
          <input id="l-password" type="password" placeholder="Mot de passe" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text-primary);font-size:.95rem;width:100%;transition:.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
          <div id="l-error" style="color:var(--accent);font-size:.83rem;display:none;padding:8px 12px;background:var(--accent-soft);border-radius:6px;"></div>
          <button onclick="submitLogin()" style="background:var(--accent);color:white;border:none;border-radius:8px;padding:13px;font-size:.95rem;font-weight:600;cursor:pointer;transition:.2s;margin-top:4px;" onmouseover="this.style.background='var(--accent-hover)'" onmouseout="this.style.background='var(--accent)'">Se connecter →</button>
        </div>
      </div>

      <!-- REGISTER -->
      <div id="form-register" style="display:none;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <input id="r-email" type="email" placeholder="Email" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text-primary);font-size:.95rem;width:100%;transition:.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
          <input id="r-password" type="password" placeholder="Mot de passe" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text-primary);font-size:.95rem;width:100%;transition:.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
          <input id="r-confirm" type="password" placeholder="Confirmer le mot de passe" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text-primary);font-size:.95rem;width:100%;transition:.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
          <div id="r-error" style="color:var(--accent);font-size:.83rem;display:none;padding:8px 12px;background:var(--accent-soft);border-radius:6px;"></div>
          <button onclick="submitRegister()" style="background:var(--accent);color:white;border:none;border-radius:8px;padding:13px;font-size:.95rem;font-weight:600;cursor:pointer;transition:.2s;margin-top:4px;" onmouseover="this.style.background='var(--accent-hover)'" onmouseout="this.style.background='var(--accent)'">Créer mon compte →</button>
        </div>
      </div>

      <button onclick="closeAuthModal()" style="width:100%;background:none;border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text-muted);cursor:pointer;font-size:.85rem;margin-top:14px;">Annuler</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAuthModal(); });

  if (defaultTab === 'register') switchAuthTab('register');

  // Enter key
  setTimeout(() => {
    document.getElementById('l-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitLogin(); });
    document.getElementById('r-confirm')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitRegister(); });
  }, 0);
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const loginBtn = document.getElementById('tab-login');
  const registerBtn = document.getElementById('tab-register');
  if (!loginForm) return;

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginBtn.style.background = 'var(--accent)'; loginBtn.style.color = 'white';
    registerBtn.style.background = 'transparent'; registerBtn.style.color = 'var(--text-secondary)';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    registerBtn.style.background = 'var(--accent)'; registerBtn.style.color = 'white';
    loginBtn.style.background = 'transparent'; loginBtn.style.color = 'var(--text-secondary)';
  }
}

function closeAuthModal() {
  const m = document.getElementById('zaza-auth-modal');
  if (m) m.remove();
}

async function submitLogin() {
  const email = document.getElementById('l-email').value.trim();
  const password = document.getElementById('l-password').value;
  const err = document.getElementById('l-error');
  err.style.display = 'none';
  if (!email || !password) { err.textContent = 'Remplissez tous les champs'; err.style.display = 'block'; return; }
  try {
    await AuthAPI.login(email, password);
    closeAuthModal();
    showToast('Connexion réussie ✅');
    onAuthSuccess();
  } catch (e) { err.textContent = e.message; err.style.display = 'block'; }
}

async function submitRegister() {
  const email = document.getElementById('r-email').value.trim();
  const password = document.getElementById('r-password').value;
  const confirm = document.getElementById('r-confirm').value;
  const err = document.getElementById('r-error');
  err.style.display = 'none';
  if (!email || !password || !confirm) { err.textContent = 'Remplissez tous les champs'; err.style.display = 'block'; return; }
  if (password !== confirm) { err.textContent = 'Les mots de passe ne correspondent pas'; err.style.display = 'block'; return; }
  if (password.length < 6) { err.textContent = 'Mot de passe trop court (6 caractères min)'; err.style.display = 'block'; return; }
  try {
    await AuthAPI.register(email, password);
    closeAuthModal();
    showToast('Compte créé avec succès 🎉');
    onAuthSuccess();
  } catch (e) { err.textContent = e.message; err.style.display = 'block'; }
}

function onAuthSuccess() {
  updateLoginButtons();
  updateCartCount();
}

function updateLoginButtons() {
  document.querySelectorAll('.btn-login').forEach(btn => {
    btn.textContent = Auth.isLoggedIn() ? 'Mon compte' : 'Se connecter';
  });
}

// ══════════════════════════════════════════════
//  INIT GLOBAL
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateLoginButtons();
  updateCartCount();

  // Bouton login/compte
  document.querySelectorAll('.btn-login').forEach(btn => {
    btn.addEventListener('click', () => {
      if (Auth.isLoggedIn()) {
        if (confirm('Se déconnecter ?')) {
          AuthAPI.logout();
          updateLoginButtons();
          updateCartCount();
          showToast('Déconnecté');
          window.location.reload();
        }
      } else {
        showAuthModal('login');
      }
    });
  });

  // Bouton panier header
  document.querySelectorAll('[title="Panier"], .icon-btn[href="#"]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openCart(); });
  });

  // Bouton favoris header → ouvre auth si pas connecté
  document.querySelectorAll('[title="Favoris"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) showAuthModal();
    });
  });

  // Recherche globale
  initSearch();
});

// ══════════════════════════════════════════════
//  RECHERCHE GLOBALE (toutes les pages)
// ══════════════════════════════════════════════
let _searchProducts = null;
let _searchTimer = null;

function initSearch() {
  const input = document.getElementById('search');
  if (!input) return;

  // Styles du dropdown
  if (!document.getElementById('search-dropdown-style')) {
    const s = document.createElement('style');
    s.id = 'search-dropdown-style';
    s.textContent = `
      .search-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0; right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 16px 40px rgba(0,0,0,.5);
        z-index: 200;
        overflow: hidden;
        animation: dropIn .15s ease;
      }
      @keyframes dropIn {
        from { opacity:0; transform:translateY(-6px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .search-result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        cursor: pointer;
        transition: background .15s;
        border-bottom: 1px solid var(--border);
        text-decoration: none;
        color: var(--text-primary);
      }
      .search-result-item:last-child { border-bottom: none; }
      .search-result-item:hover { background: var(--bg-elevated); }
      .search-result-img {
        width: 44px; height: 56px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
        background: var(--bg-elevated);
      }
      .search-result-info { flex: 1; min-width: 0; }
      .search-result-name {
        font-size: .88rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .search-result-meta {
        font-size: .78rem;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      .search-result-price {
        font-size: .9rem;
        font-weight: 600;
        flex-shrink: 0;
        color: var(--text-primary);
      }
      .search-no-results {
        padding: 20px;
        text-align: center;
        color: var(--text-secondary);
        font-size: .9rem;
      }
      .search-footer {
        padding: 10px 14px;
        background: var(--bg-elevated);
        border-top: 1px solid var(--border);
        font-size: .82rem;
        color: var(--text-secondary);
        text-align: center;
        cursor: pointer;
        transition: color .15s;
      }
      .search-footer:hover { color: var(--text-primary); }
      .search-highlight { color: var(--accent); font-weight: 600; }
      .header-search { position: relative; }
    `;
    document.head.appendChild(s);
  }

  input.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    const q = input.value.trim();
    if (!q) { closeSearchDropdown(); return; }
    _searchTimer = setTimeout(() => runSearch(q), 280);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) {
        closeSearchDropdown();
        window.location.href = `./collections.html?q=${encodeURIComponent(q)}`;
      }
    }
    if (e.key === 'Escape') { closeSearchDropdown(); input.blur(); }
  });

  // Fermer si clic en dehors
  document.addEventListener('click', e => {
    if (!input.closest('.header-search').contains(e.target)) closeSearchDropdown();
  });
}

async function runSearch(query) {
  // Charger les produits une seule fois et les mettre en cache
  if (!_searchProducts) {
    try { _searchProducts = await ProductsAPI.getAll(); }
    catch { return; }
  }

  const q = query.toLowerCase();
  const results = _searchProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.type && p.type.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q))
  ).slice(0, 6);

  renderSearchDropdown(results, query);
}

function highlight(text, query) {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx)
    + `<span class="search-highlight">${text.slice(idx, idx + query.length)}</span>`
    + text.slice(idx + query.length);
}

function renderSearchDropdown(results, query) {
  closeSearchDropdown();

  const input = document.getElementById('search');
  if (!input) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown';
  dropdown.id = 'search-dropdown';

  if (!results.length) {
    dropdown.innerHTML = `<div class="search-no-results">😕 Aucun résultat pour "<strong>${query}</strong>"</div>`;
  } else {
    dropdown.innerHTML = results.map(p => {
      const images = getProductImages(p);
      const img = images[0] || 'https://images.unsplash.com/photo-1559181567-c3190ca9d222?w=100&q=60';
      const fp = calcFinalPrice(p.price, p.discount);
      return `
        <a class="search-result-item" href="./productId.html?id=${p.id}">
          <img class="search-result-img" src="${img}" alt="${p.name}" loading="lazy">
          <div class="search-result-info">
            <div class="search-result-name">${highlight(p.name, query)}</div>
            <div class="search-result-meta">${p.type || ''} ${p.discount ? `· <span style="color:var(--accent)">-${p.discount}%</span>` : ''}</div>
          </div>
          <div class="search-result-price">${fp} €</div>
        </a>`;
    }).join('');

    dropdown.innerHTML += `
      <div class="search-footer" onclick="window.location.href='./collections.html?q=${encodeURIComponent(query)}'">
        Voir tous les résultats pour "<strong>${query}</strong>" →
      </div>`;
  }

  input.closest('.header-search').appendChild(dropdown);
}

function closeSearchDropdown() {
  document.getElementById('search-dropdown')?.remove();
}