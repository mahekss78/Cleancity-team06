const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    hierarchy: {
        state: { type: String, required: true, index: true },
        city: { type: String, required: true, index: true },
        neighborhood: { type: String, required: true },
        pincode: { type: String, index: true }
    },
    demographics: {
        hindu: { type: Number, default: 0.80 },
        muslim: { type: Number, default: 0.14 },
        buddhist: { type: Number, default: 0.01 },
        christian: { type: Number, default: 0.02 },
        others: { type: Number, default: 0.03 }
    },
    history: [{
        year: { type: Number, required: true },
        avgVolume: { type: Number, required: true }, // kg per week
        peakIntensity: { type: Number, default: 1.0 }
    }],
    prediction2026: {
        score: { type: Number },
        reason: { type: String }
    },
    metadata: {
        type: { type: String, enum: ['Market', 'Residential', 'Transit', 'Temple', 'Slum', 'Public_ground', 'Beach'], default: 'Market' },
        baseWeight: { type: Number, default: 1.0 },
        radius: { type: Number, default: 500 }
    }
}, { timestamps: true });

hotspotSchema.index({ "hierarchy.state": 1, "hierarchy.city": 1 });

hotspotSchema.index({ location: '2dsphere' });

const Hotspot = mongoose.model('Hotspot', hotspotSchema);
module.exports = Hotspot;
