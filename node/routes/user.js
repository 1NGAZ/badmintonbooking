// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { selectUserId, updateUser, getProfile } = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/authMiddleware');

router.get('/selectuserid', selectUserId);
router.patch('/users/profile', authenticateUser, updateUser);
router.get('/profile', authenticateUser, getProfile);

module.exports = router;
