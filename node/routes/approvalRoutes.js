const express = require('express');
const { getPendingReservations, approveReservation, rejectReservation } = require('../controllers/approvalController');
const { authenticateUser, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// ดึงข้อมูลการจองที่รอดำเนินการ
router.get('/approvals/pending', authenticateUser, isAdmin, getPendingReservations);

// อนุมัติการจอง
router.post('/approvals/approve', authenticateUser, isAdmin, approveReservation);

// ปฏิเสธการจอง
router.post('/approvals/reject', authenticateUser, isAdmin, rejectReservation);

module.exports = router;
