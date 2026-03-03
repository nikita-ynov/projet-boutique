const express = require("express");
const { addFavorites, getFavorites, deleteFavorites } = require("../controllers/favorites");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// добавить в избранное
router.post("/favorites/:productId", authMiddleware, addFavorites);

// получить все избранные пользователя
router.get("/favorites", authMiddleware, getFavorites);

// удалить из избранного
router.delete("/favorites/:productId", authMiddleware, deleteFavorites);

module.exports = router;