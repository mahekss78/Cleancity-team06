const express = require('express');
const router = express.Router();
const axios = require('axios');
const Bin = require('../models/binModel');
const Complaint = require('../models/complaintModel');
const { protect, admin, driver } = require('../middleware/authMiddleware');

// @desc    Get optimized route for driver
// @route   POST /api/logistics/optimize
// @access  Private (Driver)
router.post('/optimize', protect, async (req, res) => {
    try {
        const { startLocation } = req.body; // { lat, lng }
        const city = req.user.city;

        // 1. Fetch all full/overflowing bins in driver's city
        const bins = await Bin.find({ 
            city: city, 
            status: { $in: ['full', 'overflowing'] } 
        });

        // 2. Fetch all pending complaints in driver's city
        const complaints = await Complaint.find({ 
            city: city, 
            status: 'pending' 
        });

        // 3. Combine them into "spots"
        let spots = [];
        
        bins.forEach(bin => {
            spots.push({
                id: bin._id,
                type: 'bin',
                lat: bin.location.lat,
                lng: bin.location.lng,
                address: bin.address
            });
        });

        complaints.forEach(complaint => {
            // Filter out complaints without coordinates
            if (complaint.location && complaint.location.lat) {
                spots.push({
                    id: complaint._id,
                    type: 'complaint',
                    lat: complaint.location.lat,
                    lng: complaint.location.lng,
                    address: complaint.locationName || complaint.description
                });
            }
        });

        if (spots.length === 0) {
            return res.json({ optimizedRoute: [] });
        }

        // 4. Call FastAPI Logistics Service
        const response = await axios.post('http://localhost:8000/optimize', {
            start_location: startLocation,
            spots: spots.map(s => ({ lat: s.lat, lng: s.lng }))
        });

        const { optimized_indices } = response.data;

        // 5. Reorder spots based on optimization result
        const optimizedRoute = optimized_indices.map(idx => spots[idx]);

        res.json({ optimizedRoute });

    } catch (error) {
        console.error("Logistics Error:", error.message);
        res.status(500).json({ message: "Failed to optimize route" });
    }
});

module.exports = router;
