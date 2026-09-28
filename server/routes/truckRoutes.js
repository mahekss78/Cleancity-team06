const express = require('express');
const router = express.Router();
const { getTrucks, createTruck, deleteTruck } = require('../controllers/truckController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getTrucks).post(protect, admin, createTruck);
router.route('/:id').delete(protect, admin, deleteTruck);

module.exports = router;
