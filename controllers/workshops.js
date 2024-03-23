const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Workshop = require('../models/Workshop');

// @desc      Get workshops
// @route     GET /api/v1/workshops
// @access    Public
exports.getWorkshops = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single workshop
// @route     GET /api/v1/workshops/:id
// @access    Public
exports.getWorkshop = asyncHandler(async (req, res, next) => {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
        return next(
            new ErrorResponse(`No workshop with the id of ${req.params.id}`, 404),
        );
    }

    res.status(200).json({
        success: true,
        data: workshop
    });
});

// @desc      Add workshop
// @route     POST /api/v1/workshops
// @access    Private
exports.addWorkshop = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const workshop = await Workshop.create(req.body);

    res.status(200).json({
        success: true,
        data: workshop
    });
});

// @desc      Update workshop
// @route     PUT /api/v1/workshops/:id
// @access    Private
exports.updateWorkshop = asyncHandler(async (req, res, next) => {
    let workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
        return next(new ErrorResponse(`No workshop with the id of ${req.params.id}`), 404);
    }

    // Make sure user is workshop owner
    if (workshop.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update workshop ${course._id}`, 401));
    }

    workshop = await Workshop.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: workshop
    });
});

// @desc      Delete workshop
// @route     DELETE /api/v1/workshops/:id
// @access    Private
exports.deleteWorkshop = asyncHandler(async (req, res, next) => {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
        return next(
            new ErrorResponse(`No workshop with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is workshop owner
    if (workshop.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete workshop ${course._id}`, 401));
    }

    await workshop.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});