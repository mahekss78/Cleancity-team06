const mongoose = require('mongoose');
const Bin = require('./models/binModel');
require('dotenv').config();

const bins = [
    // Thane Bins
    {
        location: { lat: 19.2183, lng: 72.9781 },
        address: 'Thane Station Rd, Jambli Naka',
        city: 'Thane',
        type: 'General Waste',
        status: 'full',
        fillLevel: 90
    },
    {
        location: { lat: 19.2023, lng: 72.9758 },
        address: 'Kopri, Thane East',
        city: 'Thane',
        type: 'Recycling',
        status: 'overflowing',
        fillLevel: 100
    },
    // Nagpur Bins
    {
        location: { lat: 21.1458, lng: 79.0882 },
        address: 'Sitabuldi Fort, Central Nagpur',
        city: 'Nagpur',
        type: 'General Waste',
        status: 'full',
        fillLevel: 85
    },
    {
        location: { lat: 21.1264, lng: 79.0561 },
        address: 'Ambazari Lake View, Nagpur',
        city: 'Nagpur',
        type: 'Recycling',
        status: 'overflowing',
        fillLevel: 95
    },
    // Mumbai Bins
    {
        location: { lat: 19.0760, lng: 72.8777 },
        address: 'Dharavi Main Rd, Mumbai',
        city: 'Mumbai',
        type: 'General Waste',
        status: 'full',
        fillLevel: 80
    },
    {
        location: { lat: 18.9220, lng: 72.8347 },
        address: 'Gateway of India, Colaba',
        city: 'Mumbai',
        type: 'Organic',
        status: 'half-full',
        fillLevel: 50
    }
];

const seedDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleancity';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB for multi-city seeding...');

        await Bin.deleteMany({});
        console.log('Cleared existing bins.');

        await Bin.insertMany(bins);
        console.log(`Seed: ${bins.length} bins added across multiple cities!`);

        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDB();
