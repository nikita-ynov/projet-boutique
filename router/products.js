const express = require("express");
const router = express.Router();

const productController = require("../controllers/products");

router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProductById);
router.get("/products/:id/similar", productController.getSimiliarProducts);

router.post("/products", productController.addProduct);
router.put("/products/:id", productController.editProduct);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router