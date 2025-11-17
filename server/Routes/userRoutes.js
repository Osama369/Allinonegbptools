const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getCurrentUser } = require("../Controllers/userController");
const auth = require("../Middleware/Auth");

// Route: POST /api/users
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get('/me', auth, getCurrentUser);

module.exports = router;
