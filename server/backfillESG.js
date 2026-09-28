const mongoose = require('mongoose');
const Complaint = require('./models/complaintModel');
const dotenv = require('dotenv');

dotenv.config();

const backfillCarbon = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cleancity');
        console.log("Connected to MongoDB for ESG Backfill...");

        const complaints = await Complaint.find({ status: 'resolved', carbonOffset: { $exists: false } });
        console.log(`Found ${complaints.length} resolved complaints without carbon data.`);

        for (const c of complaints) {
            let co2eSaved = 0;
            const weight = parseFloat(c.wasteSummary?.exactWeight || 0) || (c.wasteSummary?.volume === '> 20kg' ? 25 : (c.wasteSummary?.volume === '< 5kg' ? 3 : 12.5));
            
            if (c.wasteSummary?.category === 'Organic') {
                co2eSaved += weight * 0.82;
            } else {
                co2eSaved += weight * 0.35;
            }
            
            co2eSaved += 1.2; // Logistics constant
            
            c.carbonOffset = parseFloat(co2eSaved.toFixed(2));
            if (!c.finalizedAt) c.finalizedAt = c.updatedAt;
            await c.save();
        }

        console.log("ESG Backfill Completed Successfully.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

backfillCarbon();
