const express = require('express');
const router = express.Router();
const { getBins, createBin, updateBinStatus, deleteBin } = require('../controllers/binController');
const { protect, admin, driver } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBins).post(protect, admin, createBin);
router.route('/:id').put(protect, driver, updateBinStatus).delete(protect, admin, deleteBin);

module.exports = router;
