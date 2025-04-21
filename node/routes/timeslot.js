// routes/timeSlotRoutes.js
const express = require('express');
const router = express.Router();
const { createTimeSlotsForDateController } = require('../controllers/timeSlotController');
const { getTimeSlotsByDateController } = require('../controllers/timeSlotController');
// POST: สร้าง TimeSlots ใหม่สำหรับหลายๆ courtId และ 7 วัน
router.post('/timeslots', createTimeSlotsForDateController);
router.get('/gettimeslots', getTimeSlotsByDateController);
module.exports = router;
