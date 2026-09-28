const express = require('express');
const router = express.Router();
const { getRoutes, createRoute, getMyRoute } = require('../controllers/routeController');
const { protect, admin, driver } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getRoutes).post(protect, admin, createRoute);
router.route('/driver').get(protect, driver, getMyRoute);

module.exports = router;
