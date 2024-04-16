const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Schedule = require('../models/Schedule');

// @desc      Get schedules
// @route     GET /api/v1/schedules
// @access    Public
exports.getSchedules = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single schedule
// @route     GET /api/v1/schedules/:id
// @access    Public
exports.getSchedule = asyncHandler(async (req, res, next) => {
    const schedule = await Schedule.findById(req.params.id)
        .populate({
            path: 'speakers',
            select: 'name designation organization linkedin photo'
        });

    if (!schedule) {
        return next(
            new ErrorResponse(`No schedule with the id of ${req.params.id}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: schedule
    });
});

// @desc      Add schedule
// @route     POST /api/v1/schedule
// @access    Private
exports.addSchedule = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const schedule = await Schedule.create(req.body);

    res.status(200).json({
        success: true,
        data: schedule
    });
});

// @desc      Update schedule
// @route     PUT /api/v1/schedules/:id
// @access    Private
exports.updateSchedule = asyncHandler(async (req, res, next) => {
    let schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
        return next(new ErrorResponse(`No ticket with the id of ${req.params.id}`), 404);
    }

    // Make sure user is schedule owner
    if (schedule.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update schedule ${schedule._id}`, 401));
    }

    ticket = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: schedule
    });
});

// @desc      Delete schedule
// @route     DELETE /api/v1/schedules/:id
// @access    Private
exports.deleteSchedule = asyncHandler(async (req, res, next) => {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
        return next(
            new ErrorResponse(`No schedule with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is ticket owner
    if (schedule.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete schedule ${schedule._id}`, 401));
    }

    await schedule.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});