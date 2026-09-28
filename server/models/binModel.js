const mongoose = require('mongoose');

const binSchema = mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    address: { type: String, required: true },
    type: {
        type: String,
        enum: ['General Waste', 'Recycling', 'Organic', 'Hazardous'],
        default: 'General Waste'
    },
    status: {
        type: String,
        enum: ['empty', 'half-full', 'full', 'overflowing'],
        default: 'empty'
    },
    fillLevel: { type: Number, default: 0 }, // 0 to 100 percentage
    city: { 
        type: String, 
        required: true, 
        enum: ['Thane', 'Nagpur', 'Mumbai', 'Pune', 'Nashik'], 
        default: 'Thane' 
    },
    lastCollected: { type: Date },
    nextCollection: { type: Date }
}, { timestamps: true });

const Bin = mongoose.model('Bin', binSchema);
module.exports = Bin;
