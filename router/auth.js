const express = require("express");
const { registerUser, loginUser, userProfile } = require("../controller/auth");
const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/me", userProfile);


module.exports = router