const express = require('express');
const router = express.Router();
const { getReservations } = require('../controllers/historyController');

router.get('/history', getReservations);

module.exports = router;
