const express = require("express");
const { getProducts, getProductById, getSimiliarProducts, addProduct, editProduct, deleteProduct } = require("../controller/products");
const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.get("/products/:id/similar", getSimiliarProducts);

// ADMIN
router.post("/products", addProduct);
router.put("/products/:id", editProduct);
router.delete("/products/:id", deleteProduct);



module.exports = router