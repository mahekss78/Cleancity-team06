const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const http = require('http');
const socketManager = require('./services/socketManager');
const connectDB = require('./config/db');

// Models & Controllers
const multer = require("multer");

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketManager.init(server);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.get('/', (req, res) => {
    res.send('CleanCity API is running with Socket.io...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bins', require('./routes/binRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/predict', require('./routes/predictRoutes'));
app.use('/api/logistics', require('./routes/logisticsRoutes'));
app.use('/api/sbm', require('./routes/sbmRoutes'));
app.use('/api/esg', require('./routes/esgRoutes'));

app.use('/uploads', express.static(uploadDir));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.io active`);
});
