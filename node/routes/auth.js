const express = require("express");
const router = express.Router();
const { login, register, logout } = require("../controllers/authController");


// เส้นทาง API สำหรับ login และ register
router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);


module.exports = router;
