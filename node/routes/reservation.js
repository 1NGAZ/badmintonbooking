const express = require('express');
const { createReservations } = require('../controllers/reservationController');
const upload = require('../middlewares/upload'); // แก้ path ให้ถูกต้อง
const router = express.Router();

// เส้นทางสำหรับจองสนาม พร้อม Middleware จัดการไฟล์แนบ
// ตรวจสอบว่า createReservations มีการ export จาก controller จริงๆ
router.post('/reservations', upload.single('attachment'), createReservations);

module.exports = router;
