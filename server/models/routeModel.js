const mongoose = require('mongoose');

const routeSchema = mongoose.Schema({
    name: { type: String, required: true },
    assignedTruck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck' },
    bins: [{
        bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
        collected: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    startTime: { type: Date },
    endTime: { type: Date }
}, { timestamps: true });

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;
