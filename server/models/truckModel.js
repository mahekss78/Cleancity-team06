const mongoose = require('mongoose');

const truckSchema = mongoose.Schema({
    plateNumber: { type: String, required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, default: 1000 }, // in kg or volume
    currentLoad: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    },
    currentLocation: {
        lat: Number,
        lng: Number
    }
}, { timestamps: true });

const Truck = mongoose.model('Truck', truckSchema);
module.exports = Truck;
