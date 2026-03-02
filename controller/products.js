const db = require('../config/db');


// =========================
// GET ALL PRODUCTS
// =========================
exports.getProducts = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      color,
      type,
      gender,
      promotion,
      sort
    } = req.query;

    let query = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pc.color) AS colors,
        GROUP_CONCAT(DISTINCT ps.size) AS sizes,
        GROUP_CONCAT(DISTINCT pi.image_url) AS images
      FROM products p
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `;

    let conditions = [];
    let values = [];

    if (minPrice) {
      conditions.push("p.price >= ?");
      values.push(minPrice);
    }

    if (maxPrice) {
      conditions.push("p.price <= ?");
      values.push(maxPrice);
    }

    if (type) {
      conditions.push("p.type = ?");
      values.push(type);
    }

    if (gender) {
      conditions.push("p.gender = ?");
      values.push(gender);
    }

    if (promotion === "true") {
      conditions.push("p.discount > 0");
    }

    if (color) {
      conditions.push("pc.color = ?");
      values.push(color);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY p.id ";

    if (sort === "price_asc") {
      query += " ORDER BY p.price ASC";
    } else if (sort === "price_desc") {
      query += " ORDER BY p.price DESC";
    }

    const [products] = await db.query(query, values);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// =========================
// GET PRODUCT BY ID
// =========================
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    const product = products[0];

    const [colors] = await db.query(
      `SELECT color FROM product_colors WHERE product_id = ?`,
      [id]
    );

    const [sizes] = await db.query(
      `SELECT size FROM product_sizes WHERE product_id = ?`,
      [id]
    );

    const [images] = await db.query(
      `SELECT image_url, is_main FROM product_images WHERE product_id = ?`,
      [id]
    );

    product.colors = colors.map(c => c.color);
    product.sizes = sizes.map(s => s.size);
    product.images = images;

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// =========================
// SIMILAR PRODUCTS
// =========================
exports.getSimiliarProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const [currentProduct] = await db.query(
      `SELECT type FROM products WHERE id = ?`,
      [id]
    );

    if (!currentProduct.length) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    const type = currentProduct[0].type;

    const [similar] = await db.query(
      `SELECT * FROM products 
       WHERE type = ? AND id != ?
       LIMIT 4`,
      [type, id]
    );

    res.json(similar);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// =========================
// EDIT PRODUCT (ADMIN)
// =========================
exports.editProduct = async (req, res) => {
  const { id } = req.params;
  const {
    reference,
    name,
    description,
    price,
    discount,
    currency,
    stock,
    gender,
    type,
    colors,
    sizes,
    images
  } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE products 
       SET reference=?, name=?, description=?, price=?, discount=?, 
           currency=?, stock=?, gender=?, type=?
       WHERE id=?`,
      [reference, name, description, price, discount, currency, stock, gender, type, id]
    );

    // delete old relations
    await connection.query(`DELETE FROM product_colors WHERE product_id=?`, [id]);
    await connection.query(`DELETE FROM product_sizes WHERE product_id=?`, [id]);
    await connection.query(`DELETE FROM product_images WHERE product_id=?`, [id]);

    // reinsert colors
    if (colors) {
      for (let color of colors) {
        await connection.query(
          `INSERT INTO product_colors (product_id, color) VALUES (?, ?)`,
          [id, color]
        );
      }
    }

    // reinsert sizes
    if (sizes) {
      for (let size of sizes) {
        await connection.query(
          `INSERT INTO product_sizes (product_id, size) VALUES (?, ?)`,
          [id, size]
        );
      }
    }

    // reinsert images
    if (images) {
      for (let i = 0; i < images.length; i++) {
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)`,
          [id, images[i], i === 0]
        );
      }
    }

    await connection.commit();
    connection.release();

    res.json({ message: "Produit mis à jour ✅" });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};


// =========================
// DELETE PRODUCT (ADMIN)
// =========================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM products WHERE id = ?`, [id]);

    res.json({ message: "Produit supprimé 🗑️" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};