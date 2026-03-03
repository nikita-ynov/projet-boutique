const db = require('../config/db');


// ===============================
// Helper: Get or Create Cart
// ===============================
const getOrCreateCart = async (userId) => {
  const [carts] = await db.query(
    "SELECT * FROM carts WHERE user_id = ?",
    [userId]
  );

  if (carts.length > 0) {
    return carts[0];
  }

  const [result] = await db.query(
    "INSERT INTO carts (user_id) VALUES (?)",
    [userId]
  );

  return { id: result.insertId };
};



// ===============================
// VIEW CART
// ===============================
exports.viewCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await getOrCreateCart(userId);

    const [items] = await db.query(
      `
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.discount
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      `,
      [cart.id]
    );

    res.json(items);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ===============================
// ADD PRODUCT TO CART
// ===============================
exports.addProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "productId et quantity requis" });
    }

    const [products] = await db.query(
      "SELECT stock FROM products WHERE id = ?",
      [productId]
    );

    if (!products.length) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    if (quantity > products[0].stock) {
      return res.status(400).json({ message: "Stock insuffisant" });
    }

    const cart = await getOrCreateCart(userId);

    const [existing] = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart.id, productId]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?",
        [quantity, cart.id, productId]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
        [cart.id, productId, quantity]
      );
    }

    res.status(201).json({ message: "Produit ajouté au panier 🛒" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ===============================
// EDIT CART ITEM QUANTITY
// ===============================
exports.editCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const cart = await getOrCreateCart(userId);

    await db.query(
      "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?",
      [quantity, cart.id, productId]
    );

    res.json({ message: "Quantité mise à jour ✅" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ===============================
// DELETE ONE PRODUCT
// ===============================
exports.deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await getOrCreateCart(userId);

    await db.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart.id, productId]
    );

    res.json({ message: "Produit supprimé du panier ❌" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ===============================
// DELETE ALL CART
// ===============================
exports.deleteAll = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await getOrCreateCart(userId);

    await db.query(
      "DELETE FROM cart_items WHERE cart_id = ?",
      [cart.id]
    );

    res.json({ message: "Panier vidé 🧹" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};