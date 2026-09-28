const Truck = require('../models/truckModel');

// @desc    Get all trucks
// @route   GET /api/trucks
// @access  Private (Admin)
const getTrucks = async (req, res) => {
    try {
        const trucks = await Truck.find().populate('driver', 'name email');
        res.status(200).json(trucks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a truck
// @route   POST /api/trucks
// @access  Private (Admin)
const createTruck = async (req, res) => {
    const { plateNumber, driver, capacity } = req.body;

    try {
        const truck = await Truck.create({
            plateNumber,
            driver: driver || null,
            capacity
        });
        res.status(201).json(truck);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a truck
// @route   DELETE /api/trucks/:id
// @access  Private (Admin)
const deleteTruck = async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);

        if (!truck) {
            return res.status(404).json({ message: 'Truck not found' });
        }

        await truck.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTrucks, createTruck, deleteTruck };
