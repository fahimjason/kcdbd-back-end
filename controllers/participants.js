const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Participant = require('../models/Participant');

// @desc      Get all users
// @route     GET /api/v1/participants
// @access    Private/Admin
exports.getParticipants = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single user
// @route     GET /api/v1/participants/:id
// @access    Private/Admin
exports.getParticipant = asyncHandler(async (req, res, next) => {
    const participant = await Participant.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: participant
    });
});

// @desc      Create participant
// @route     POST /api/v1/participants
// @access    Private/Admin
exports.createParticipant = asyncHandler(async (req, res, next) => {
    const participant = await Participant.create(req.body);

    res.status(201).json({
        success: true,
        data: participant
    });
});

// @desc      Update participant
// @route     PUT /api/v1/participants/:id
// @access    Private/Admin
exports.updateParticipant = asyncHandler(async (req, res, next) => {
    const participant = await Participant.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: participant
    });
});

// @desc      Delete participant
// @route     DELETE /api/v1/participants/:id
// @access    Private/Admin
exports.deleteParticipant = asyncHandler(async (req, res, next) => {
    await Participant.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});
