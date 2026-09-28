const Bin = require('../models/binModel');

// @desc    Get all bins
// @route   GET /api/bins
// @access  Private (Resident/Admin/Driver)
const getBins = async (req, res) => {
    try {
        let filter = {};
        if (req.user && req.user.role === 'driver') {
            filter = { city: req.user.city };
        }
        const bins = await Bin.find(filter);
        res.status(200).json(bins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a bin
// @route   POST /api/bins
// @access  Private (Admin)
const createBin = async (req, res) => {
    const { lat, lng, address, type } = req.body;

    if (!lat || !lng || !address) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        const bin = await Bin.create({
            location: { lat, lng },
            address,
            type
        });
        res.status(201).json(bin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update bin status
// @route   PUT /api/bins/:id
// @access  Private (Driver/Admin)
const updateBinStatus = async (req, res) => {
    const { status, fillLevel } = req.body;

    try {
        const bin = await Bin.findById(req.params.id);

        if (!bin) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        bin.status = status || bin.status;
        bin.fillLevel = fillLevel !== undefined ? fillLevel : bin.fillLevel;

        if (status === 'empty') {
            bin.lastCollected = Date.now();
            bin.fillLevel = 0;
        }

        const updatedBin = await bin.save();
        res.status(200).json(updatedBin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a bin
// @route   DELETE /api/bins/:id
// @access  Private (Admin)
const deleteBin = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id);

        if (!bin) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        await bin.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBins,
    createBin,
    updateBinStatus,
    deleteBin
};
