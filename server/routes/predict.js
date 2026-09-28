const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save to the 'uploads/' folder
    },
    filename: (req, file, cb) => {
        // Create a unique filename: timestamp + original name
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// 3. The Route
app.post('/api/predict', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // The path to the saved image
        const localFilePath = req.file.path; 

        // TODO: Forward 'localFilePath' to your FastAPI Python service for YOLOv11 analysis
        // For now, let's return the local path
        res.json({
            message: "Image saved successfully",
            filePath: localFilePath,
            total_detected: 1, // Mock result for testing
            prediction: "garbage"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});