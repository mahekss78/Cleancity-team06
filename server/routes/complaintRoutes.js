const express = require('express');
const router = express.Router();
const { 
    createComplaint, 
    getComplaints, 
    getMyComplaints, 
    updateComplaintStatus, 
    acceptComplaint, 
    resolveComplaint,
    declineComplaint,
    pingDrivers,
    finalizeReport,
    updateLocation,
    driverArrived,
    deleteComplaint,
    rateDriver
} = require('../controllers/complaintController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createComplaint)
    .get(protect, getComplaints);

router.route('/my').get(protect, getMyComplaints);

// Uber-like dispatcher routes
router.route('/:id/accept').patch(protect, acceptComplaint);
router.route('/:id/arrive').patch(protect, driverArrived);
router.route('/:id/resolve').patch(protect, resolveComplaint);
router.route('/:id/rate').patch(protect, rateDriver);
router.route('/:id/ping').post(protect, admin, pingDrivers);
router.route('/:id/decline').post(protect, admin, declineComplaint);
router.route('/:id/finalize').patch(protect, admin, finalizeReport);

// Live Tracking
router.route('/sync-location').patch(protect, updateLocation);

router.route('/:id')
    .put(protect, admin, updateComplaintStatus)
    .delete(protect, deleteComplaint);

module.exports = router;
