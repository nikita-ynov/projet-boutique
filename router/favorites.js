const express = require("express");
const { addFavorites, getFavorites, deleteFavorites } = require("../controllers/favorites");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/favorites/:productId", authMiddleware, addFavorites);

router.get("/favorites", authMiddleware, getFavorites);

router.delete("/favorites/:productId", authMiddleware, deleteFavorites);

module.exports = router;