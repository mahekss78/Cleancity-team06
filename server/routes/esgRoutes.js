const express = require('express');
const router = express.Router();
const { getESGAnalytics } = require('../controllers/esgController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/analytics', protect, admin, getESGAnalytics);

module.exports = router;
