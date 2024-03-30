const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Ticket = require('../models/Ticket');

// @desc      Get tickets
// @route     GET /api/v1/tickets
// @access    Public
exports.getTickets = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single ticket
// @route     GET /api/v1/tickets/:id
// @access    Public
exports.getTicket = asyncHandler(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        return next(
            new ErrorResponse(`No ticket with the id of ${req.params.id}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: ticket
    });
});

// @desc      Add ticket
// @route     POST /api/v1/tickets
// @access    Private
exports.addTicket = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const ticket = await Ticket.create(req.body);

    res.status(200).json({
        success: true,
        data: ticket
    });
});

// @desc      Update ticket
// @route     PUT /api/v1/tickets/:id
// @access    Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        return next(new ErrorResponse(`No ticket with the id of ${req.params.id}`), 404);
    }

    // Make sure user is ticket owner
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update ticket ${ticket._id}`, 401));
    }

    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: ticket
    });
});

// @desc      Delete ticket
// @route     DELETE /api/v1/tickets/:id
// @access    Private
exports.deleteTicket = asyncHandler(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        return next(
            new ErrorResponse(`No ticket with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is ticket owner
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete ticket ${ticket._id}`, 401));
    }

    await ticket.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});