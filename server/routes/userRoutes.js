const express = require('express');
const router = express.Router();
const { getAllUsers, resetPin } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllUsers);
router.route('/reset-pin').post(protect, resetPin);

module.exports = router;
