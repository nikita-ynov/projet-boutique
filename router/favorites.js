const express = require("express");
const { addFavorites } = require("../controller/favorites");
const { getFavorites } = require("../controller/favorites");
const { deleteFavorites } = require("../controller/favorites");
const router = express.Router();

router.post("/favorites", addFavorites);
router.get("/favorites/:productId", getFavorites);
router.delete("/favorites/:productId", deleteFavorites);


module.exports = router