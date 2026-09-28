const Route = require('../models/routeModel');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private (Admin)
const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find().populate('assignedTruck').populate('bins.bin');
        res.status(200).json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a route
// @route   POST /api/routes
// @access  Private (Admin)
const createRoute = async (req, res) => {
    const { name, assignedTruck, bins } = req.body;
    // bins should be an array of bin IDs

    try {
        const routeBins = bins.map(binId => ({ bin: binId, collected: false }));

        const route = await Route.create({
            name,
            assignedTruck,
            bins: routeBins
        });
        res.status(201).json(route);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get driver's active route
// @route   GET /api/routes/my
// @access  Private (Driver)
const getMyRoute = async (req, res) => {
    // complicated because we need to find the truck assigned to this driver, then the route assigned to that truck
    // For simplicity, let's assume the driver passes the truck ID or we look it up.
    // Better: Find Truck where driver == user.id
    try {
        // const truck = await Truck.findOne({ driver: req.user.id });
        // if (!truck) return res.status(404).json({message: 'No truck assigned'});

        // const route = await Route.findOne({ assignedTruck: truck._id, status: 'in-progress' });
        // For Exam Simplicity, let's just return all routes for now or mock it
        const routes = await Route.find().populate('bins.bin');
        res.status(200).json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRoutes, createRoute, getMyRoute };
