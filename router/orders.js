const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateStatus,
} = require('../controllers/orders');

// ── USER ────────────────────────────────
router.post('/orders',        auth, createOrder);      // Passer commande
router.get('/orders',         auth, getUserOrders);    // Mes commandes
router.get('/orders/:id',     auth, getOrderById);     // Détail commande

// ── ADMIN ───────────────────────────────
router.get('/admin/orders',           auth, adminAuth, getAllOrders);    // Toutes les commandes
router.put('/admin/orders/:id/status', auth, adminAuth, updateStatus);  // Changer statut

module.exports = router;