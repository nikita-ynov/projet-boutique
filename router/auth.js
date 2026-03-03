const express = require("express");
const { registerUser, loginUser, userProfile } = require("../controllers/auth");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/me", authMiddleware, userProfile);


module.exports = router