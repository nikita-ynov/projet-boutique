const db = require('../config/db');


// =======================
// ADD FAVORITE
// =======================
exports.addFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Проверка существует ли товар
    const [product] = await db.query(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );

    if (!product.length) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    // Проверка уже есть в избранном
    const [existing] = await db.query(
      "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Déjà en favoris" });
    }

    await db.query(
      "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
      [userId, productId]
    );

    res.status(201).json({ message: "Ajouté aux favoris ❤️" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// =======================
// GET USER FAVORITES
// =======================
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const [favorites] = await db.query(
      `
      SELECT p.*
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
      `,
      [userId]
    );

    res.json(favorites);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// =======================
// DELETE FAVORITE
// =======================
exports.deleteFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await db.query(
      "DELETE FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    res.json({ message: "Supprimé des favoris 🗑️" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};