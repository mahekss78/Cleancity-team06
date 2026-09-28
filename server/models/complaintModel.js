const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' }, // Optional, maybe general location
    locationName: { type: String }, // For manual entry if bin not selected
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    city: { 
        type: String, 
        required: true, 
        enum: ['Thane', 'Nagpur', 'Mumbai', 'Pune', 'Nashik'], 
        default: 'Thane' 
    },
    imageUrl: { type: String },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'on-the-way', 'arrived', 'resolved', 'rejected'],
        default: 'pending'
    },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // UBER-STYLE LOGISTICS FIELDS
    driverLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    routePath: {
        type: [[Number]], // Array of [lat, lng] for the map line
        default: []
    },
    rejectionReason: { type: String }, // For admin internal audit
    
    eta: { type: Number }, // Estimated time in minutes
    rewardAmount: { type: Number, default: 0 },
    
    // NEW FIELDS FOR OTP AND PDF LOGISTICS
    otp: { type: String }, // 4-digit generated code
    driverImageUrl: { type: String }, // 'After' photo uploaded by driver
    pdfReportUrl: { type: String }, // Path to the generated FastAPI report
    
    wasteSummary: {
        accurateDescription: Boolean, // [Binary] Match?
        volume: String,               // Quantity (<5kg, 5-20kg, >20kg)
        category: String,             // Classification (Plastic, Organic, etc)
        hazards: String,              // Condition (Medical, Chemical, None, etc)
        otpVerified: Boolean
    },
    adminRemarks: { type: String, default: '' },
    isAuthorized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
    driverRating: { type: Number, min: 1, max: 5 },
    driverFeedback: { type: String },
    carbonOffset: { type: Number, default: 0 } // KG of CO2 equivalent saved
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
