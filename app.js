require('dotenv').config()
const express = require("express");
const db = require('./config/db');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;


app.use(cors({
    origin: true 
}))

const productsRouter = require("./router/products")
const favoritesRouter = require("./router/favorites")
const cartRouter = require("./router/cart")
const authRouter = require("./router/auth")

app.use(productsRouter)

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ message: 'Connexion MySQL réussie 🎉' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () =>
    console.log(`=========== EXPRESS JS ===========\n         Server started.\n           PORT: ${PORT}\n      http://localhost:${PORT}/\n=========== EXPRESS JS ===========`)
)