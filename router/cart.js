const express = require("express");
const { viewCart, editCart, deleteAll, addProduct, deleteProduct } = require("../controllers/cart");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/cart", authMiddleware, viewCart);
router.post("/cart", authMiddleware, addProduct);
router.put("/cart", authMiddleware, editCart);
router.delete("/cart/:productId", authMiddleware, deleteProduct);
router.delete("/cart", authMiddleware, deleteAll);

module.exports = router;