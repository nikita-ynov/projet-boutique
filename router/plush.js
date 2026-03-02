const express = require("express");
const { getPlush } = require("../controller/plush");
const router = express.Router();

router.get("/plush", getPlush);

module.exports = router