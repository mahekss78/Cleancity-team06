const Complaint = require("../models/complaintModel");

exports.getESGAnalytics = async (req, res) => {
    try {
        const stats = await Complaint.aggregate([
            { $match: { status: 'resolved' } },
            {
                $group: {
                    _id: null,
                    totalCO2Saved: { $sum: { $ifNull: ["$carbonOffset", 0] } },
                    totalWasteProcessed: { $sum: 1 },
                    organicWeight: {
                        $sum: {
                            $cond: [
                                { $eq: ["$wasteSummary.category", "Organic"] },
                                { $convert: { input: { $ifNull: ["$wasteSummary.exactWeight", 12.5] }, to: "double", onError: 12.5 } },
                                0
                            ]
                        }
                    },
                    plasticWeight: {
                        $sum: {
                            $cond: [
                                { $in: ["$wasteSummary.category", ["Plastic", "Plastic/Recyclable"]] },
                                { $convert: { input: { $ifNull: ["$wasteSummary.exactWeight", 12.5] }, to: "double", onError: 12.5 } },
                                0
                            ]
                        }
                    },
                    ewasteWeight: {
                        $sum: {
                            $cond: [
                                { $eq: ["$wasteSummary.category", "E-waste"] },
                                { $convert: { input: { $ifNull: ["$wasteSummary.exactWeight", 12.5] }, to: "double", onError: 12.5 } },
                                0
                            ]
                        }
                    },
                    metalWeight: {
                        $sum: {
                            $cond: [
                                { $eq: ["$wasteSummary.category", "Metal"] },
                                { $convert: { input: { $ifNull: ["$wasteSummary.exactWeight", 12.5] }, to: "double", onError: 12.5 } },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // TODAY'S STATS (Specifically for the current date)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayStats = await Complaint.aggregate([
            { $match: { status: 'resolved', finalizedAt: { $gte: startOfToday } } },
            {
                $group: {
                    _id: null,
                    todayCarbon: { $sum: "$carbonOffset" },
                    todayWaste: { $sum: 1 }
                }
            }
        ]);

        const cityLeaderboard = await Complaint.aggregate([
            { $match: { status: 'resolved' } },
            {
                $group: {
                    _id: "$city",
                    carbonSaved: { $sum: { $ifNull: ["$carbonOffset", 0] } },
                    tasksResolved: { $sum: 1 }
                }
            },
            { $sort: { carbonSaved: -1 } }
        ]);

        const trends = await Complaint.aggregate([
            { $match: { status: 'resolved' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$finalizedAt" } },
                    dailyCarbon: { $sum: { $ifNull: ["$carbonOffset", 0] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const defaultSummary = { 
            totalCO2Saved: 0, 
            totalWasteProcessed: 0, 
            organicWeight: 0, 
            plasticWeight: 0 
        };

        res.status(200).json({
            summary: stats[0] || defaultSummary,
            today: todayStats[0] || { todayCarbon: 0, todayWaste: 0 },
            leaderboard: cityLeaderboard || [],
            trends: trends || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
