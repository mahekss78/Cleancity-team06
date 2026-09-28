const express = require('express');
const router = express.Router();
const multer = require('multer');
const { predictImage, getHotspots, getUpcomingEvents, getGeography, getLiveForecast } = require('../controllers/predictController');

// Standard Multer config to save to your existing 'uploads/' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// This matches your app.use('/api/predict', ...) in server.js
router.post('/', upload.single('image'), predictImage);
router.get('/hotspots', getHotspots);
router.get('/events', getUpcomingEvents);
router.get('/geography', getGeography);
router.get('/live-forecast', getLiveForecast);

module.exports = router;
