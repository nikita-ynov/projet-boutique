require('dotenv').config()
const express = require("express");
const db = require('./config/db');
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT;

app.use(cors({ origin: true }))
app.use(express.json())

const productsRouter = require("./router/products")
const favoritesRouter = require("./router/favorites")
const cartRouter = require("./router/cart")
const authRouter = require("./router/auth")
const ordersRouter    = require("./router/orders")
const usersRouter    = require("./router/users")

app.use(productsRouter, favoritesRouter, cartRouter, authRouter, ordersRouter, usersRouter)

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ message: 'Connexion MySQL réussie 🎉' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const path = require('path');
app.use(express.static(__dirname)); 
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ── Seed admin on startup ─────────────────────────────
async function seedAdmin() {
  try {
    const ADMIN_EMAIL = '1';
    const ADMIN_PASSWORD = '1';

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')",
      [ADMIN_EMAIL, hashed]
    );

    console.log(`🎉 Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (err) {
    console.error('❌ seedAdmin error:', err);
  }
}

app.listen(PORT, async () => {
  console.log(`=========== EXPRESS JS ===========\n         Server started.\n           PORT: ${PORT}\n      http://localhost:${PORT}/\n=========== EXPRESS JS ===========`);
  await seedAdmin();
});