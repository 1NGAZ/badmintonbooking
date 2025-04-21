// แก้ไขการ import ให้ใช้ชื่อที่ไม่ซ้ำกัน
const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authMiddleware");
const {
  getAllUsers,
  getAllRoles,
  assignRole,
  removeRole
} = require("../controllers/roleController");


// ใช้ authenticateUser แทน authenticateToke
router.get("/users", authenticateUser, getAllUsers);
router.get("/all", authenticateUser, getAllRoles);
router.post("/assign", authenticateUser, assignRole);
router.post("/remove", authenticateUser, removeRole);
module.exports = router;