const db = require('../config/db');

// ── CREATE ORDER ────────────────────────────────────────────
// Appelé quand l'utilisateur confirme son panier
// Body: { address: { firstname, lastname, street, zip, city, country } }
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { address } = req.body;

  if (!address || !address.firstname || !address.street || !address.city || !address.zip) {
    return res.status(400).json({ message: 'Adresse de livraison incomplète' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Sauvegarder l'adresse
    const [addrResult] = await connection.query(
      `INSERT INTO addresses (user_id, firstname, lastname, street, zip, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, address.firstname, address.lastname, address.street,
       address.zip, address.city, address.country || 'France']
    );
    const addressId = addrResult.insertId;

    // 2. Récupérer le panier
    const [carts] = await connection.query(
      'SELECT id FROM carts WHERE user_id = ?', [userId]
    );
    if (!carts.length) throw new Error('Panier introuvable');
    const cartId = carts[0].id;

    const [items] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.discount, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (!items.length) throw new Error('Le panier est vide');

    // 3. Vérifier le stock et calculer le total
    for (const item of items) {
      if (item.quantity > item.stock) {
        throw new Error(`Stock insuffisant pour "${item.name}" (${item.stock} disponibles)`);
      }
    }

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { address } = req.body;

  if (!address || !address.firstname || !address.street || !address.city || !address.zip) {
    return res.status(400).json({ message: 'Adresse de livraison incomplète' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Sauvegarder l'adresse
    const [addrResult] = await connection.query(
      `INSERT INTO addresses (user_id, firstname, lastname, street, zip, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        address.firstname,
        address.lastname,
        address.street,
        address.zip,
        address.city,
        address.country || 'France'
      ]
    );
    const addressId = addrResult.insertId;

    // 2. Récupérer le panier
    const [carts] = await connection.query(
      'SELECT id FROM carts WHERE user_id = ?',
      [userId]
    );

    if (!carts.length) {
      throw new Error('Panier introuvable');
    }

    const cartId = carts[0].id;

    const [items] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.discount, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (!items.length) {
      throw new Error('Le panier est vide');
    }

    // 3. Vérifier le stock
    for (const item of items) {
      if (item.quantity > item.stock) {
        throw new Error(`Stock insuffisant pour "${item.name}" (${item.stock} disponibles)`);
      }
    }

    // 4. Calculer le total
    const totalPrice = items.reduce((sum, item) => {
      const price = Number(item.price);
      const discount = Number(item.discount || 0);

      const finalPrice = discount > 0
        ? price * (1 - discount / 100)
        : price;

      return sum + finalPrice * Number(item.quantity);
    }, 0);

    // 5. Créer la commande
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, address_id, total_price, status)
       VALUES (?, ?, ?, 'pending')`,
      [userId, addressId, totalPrice.toFixed(2)]
    );

    const orderId = orderResult.insertId;

    // 6. Créer les order_items + décrémenter le stock
    for (const item of items) {
      const price = Number(item.price);
      const discount = Number(item.discount || 0);

      const finalPrice = discount > 0
        ? price * (1 - discount / 100)
        : price;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, finalPrice.toFixed(2)]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 7. Vider le panier
    await connection.query(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Commande créée avec succès ✅',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};


    const orderId = orderResult.insertId;

    // 6. Créer les order_items + décrémenter le stock
    for (const item of items) {
      const price = Number(item.price);
      const discount = Number(item.discount || 0);

      const finalPrice = discount > 0
        ? price * (1 - discount / 100)
        : price;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, finalPrice.toFixed(2)]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 7. Vider le panier
    await connection.query(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Commande créée avec succès ✅',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};


    // 6. Vider le panier
    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Commande créée avec succès ✅',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};

// ── GET USER ORDERS ─────────────────────────────────────────
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.created_at,
              a.firstname, a.lastname, a.street, a.zip, a.city, a.country
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Ajouter les items pour chaque commande
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.unit_price, p.name, p.id as product_id
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET ORDER BY ID ─────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.created_at,
              a.firstname, a.lastname, a.street, a.zip, a.city, a.country
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT oi.quantity, oi.unit_price, p.name, p.id as product_id,
              pi.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = 1
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET ALL ORDERS (ADMIN) ──────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.created_at,
              u.email,
              a.firstname, a.lastname, a.city
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN addresses a ON o.address_id = a.id
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── UPDATE ORDER STATUS (ADMIN) ─────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Statut mis à jour ✅' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};