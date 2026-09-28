const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['resident', 'admin', 'driver'],
        default: 'resident'
    },
    // UPGRADED FIELDS START HERE
    city: { type: String }, 
    state: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [79.0882, 21.1458] } // Default to Nagpur [lng, lat]
    },
    address: { type: String },
    phone: { type: String },
    plateNumber: { type: String }, // For drivers
    ecoCredits: { type: Number, default: 100 }, // Starting credits for residents
    earnings: { type: Number, default: 0 }, // For drivers
    pinCode: { type: String, default: () => Math.floor(1000 + Math.random() * 9000).toString() },
    totalRatings: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 }
}, { timestamps: true });
userSchema.index({ location: "2dsphere" });
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
