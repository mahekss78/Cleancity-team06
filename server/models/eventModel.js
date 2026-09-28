const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    scope: { type: String, enum: ['National', 'State', 'City'], default: 'National' },
    state: { type: String }, // Required if scope is 'State' or 'City'
    city: { type: String },  // Required if scope is 'City'
    impactMultiplier: { type: Number, default: 2.0 },
    participationWeight: { type: Number, default: 1.0 }, // 1.0 = All residents participate, <1.0 for specific communities
    description: { type: String }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
