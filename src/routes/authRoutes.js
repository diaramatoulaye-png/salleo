const express = require("express");
const router = express.Router();

const { register, login, refresh, me } = require("../controllers/authController");
const { verifierToken } = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", verifierToken, me);

module.exports = router;
