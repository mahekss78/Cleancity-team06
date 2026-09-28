const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Hotspot = require("../models/hotspotModel");
const Event = require("../models/eventModel");
const Complaint = require("../models/complaintModel");


exports.predictImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');

        // FIXED URL: The path MUST start with /infer/workflows/
        const response = await axios({
            method: "POST",
            url: "https://serverless.roboflow.com/infer/workflows/loki-havard-s-workspace/yolo-world-large-demo/1",
            params: {
                api_key: "1kPjvUbWiHRegiE5rSuH"
            },
            data: {
                inputs: {
                    image: {
                        type: "base64",
                        value: base64Image
                    }
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        });

        // Parse outputs from the 'outputs' field
        const results = response.data.outputs;
        if (!results || results.length === 0) {
            throw new Error("No output received from Roboflow");
        }

        const result = results[0];
        const predictions = result.predictions || [];
        
        let visualizationUrl = null;
        if (result.visualization && result.visualization.value) {
            const visualizationBuffer = Buffer.from(result.visualization.value, 'base64');
            const vizFileName = `viz-${req.file.filename}.jpg`;
            const vizPath = path.join('uploads', vizFileName);
            
            if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
            
            fs.writeFileSync(vizPath, visualizationBuffer);
            visualizationUrl = `${req.protocol}://${req.get('host')}/uploads/${vizFileName}`;
        }

        res.status(200).json({
            success: true,
            predictions: predictions,
            visualizationUrl: visualizationUrl
        });

    } catch (error) {
        // Detailed error logging
        console.error("Roboflow Error:", error.response?.data || error.message);
        const errorDetail = error.response?.data?.detail || error.message;
        res.status(500).json({ success: false, error: errorDetail });
    }
};

exports.getHotspots = async (req, res) => {
    try {
        const { state, city } = req.query;
        let filter = {};
        if (state) filter["hierarchy.state"] = state;
        if (city) filter["hierarchy.city"] = city;
        
        const hotspots = await Hotspot.find(filter);
        res.status(200).json(hotspots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUpcomingEvents = async (req, res) => {
    try {
        const { state, city } = req.query;
        let filter = {
            date: { $gte: new Date() },
            $or: [{ scope: 'National' }]
        };
        if (state) filter.$or.push({ scope: 'State', state: state });
        if (city) filter.$or.push({ scope: 'City', city: city });
        const events = await Event.find(filter).sort({ date: 1 }).limit(10);
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGeography = async (req, res) => {
    try {
        const hotspots = await Hotspot.find({}, { "hierarchy.state": 1, "hierarchy.city": 1 });
        const geoData = {};
        hotspots.forEach(spot => {
            const { state, city } = spot.hierarchy;
            if (!geoData[state]) geoData[state] = new Set();
            geoData[state].add(city);
        });
        const finalData = {};
        Object.keys(geoData).forEach(state => {
            finalData[state] = Array.from(geoData[state]);
        });
        res.json(finalData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLiveForecast = async (req, res) => {
    try {
        // 1. Fetch real driver logs (The Data Flywheel)
        // Look back 90 days to ensure we capture historical trends for training
        const resolvedComplaints = await Complaint.find({ 
            status: 'resolved',
            updatedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        
        // 2. Fetch real upcoming events/festivals from DB
        const upcomingEvents = await Event.find({ 
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days + future
        });

        // 3. Format Complaints for Python
        const events = resolvedComplaints.map(c => {
            let kg = 10; 
            if (c.wasteSummary && c.wasteSummary.exactWeight) {
                kg = parseFloat(c.wasteSummary.exactWeight);
            } else if (c.wasteSummary && c.wasteSummary.volume) {
                if (c.wasteSummary.volume.includes('> 20')) kg = 35;
                else if (c.wasteSummary.volume.includes('< 5')) kg = 4;
                else kg = 15.5; 
            }
            return {
                timestamp: c.finalizedAt || c.updatedAt || new Date().toISOString(),
                estimated_kg: kg,
                category: c.wasteSummary?.category || "Unknown",
                city: c.city || "Thane"
            };
        });

        // 4. Format Holidays for Python
        const holidays = upcomingEvents.map(e => ({
            name: e.name,
            date: e.date.toISOString(),
            impactMultiplier: e.impactMultiplier || 1.0
        }));

        // 5. Simulate Weather Impact (e.g., 30% increase if "Raining")
        // In production, you'd call a Weather API here.
        const isRaining = Math.random() > 0.7; // 30% chance for demo
        const weatherImpact = isRaining ? 1.35 : 1.0;

        // 6. Send to Python Multivariate Forecasting Engine
        const response = await axios.post("http://localhost:8000/train-prophet", { 
            events,
            holidays,
            weather_impact: weatherImpact
        });
        
        // 7. Return the 7-Day Live Prediction with Reasoning
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Live Forecast Error:", error.message);
        res.status(500).json({ message: "Failed to generate multivariate live prediction" });
    }
};
