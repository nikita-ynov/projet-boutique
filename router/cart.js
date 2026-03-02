const express = require("express");
const { viewCart, editCart, deleteAll, addProduct, deleteProduct } = require("../controller/cart");
const router = express.Router();

router.get("/cart", viewCart);
router.post("/cart", addProduct);
router.put("/cart", editCart);
router.delete("/cart/:productId", deleteProduct);
router.delete("/cart", deleteAll);


module.exports = router