const fs = require('fs');

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Participant = require('../models/Participant');
const { fileUploader } = require('../utils/file-upload');

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
    req.body.user = req.user.id;

    console.log(req.body)
    const participant = new Participant(req.body);

    if (req.files) {
        const file = fileUploader(req, participant._id, next);

        file.mv(`${process.env.FILE_UPLOAD_PATH}/uploads/${file.name}`, async err => {
            if (err) {
                console.error(err);
                return next(new ErrorResponse(`Problem with file upload`, 500));
            }
        });

        participant.photo = `uploads/${file.name}`;
        await participant.save();
    }

    res.status(201).json({
        success: true,
        data: participant
    });
});

// @desc      Update participant
// @route     PUT /api/v1/participants/:id
// @access    Private/Admin
exports.updateParticipant = asyncHandler(async (req, res, next) => {
    if(req.body.role === 'admin' && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Only admin is authorized to make new admin`), 403);
    }

    const participant = await Participant.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!participant) {
        return next(new ErrorResponse(`No participant with the id of ${req.params.id}`), 404);
    }

    res.status(200).json({
        success: true,
        data: participant
    });
});

// @desc      Delete participant
// @route     DELETE /api/v1/participants/:id
// @access    Private/Admin
exports.deleteParticipant = asyncHandler(async (req, res, next) => {
    const participant = await Participant.findByIdAndDelete(req.params.id);

    if (!participant) {
        return next(new ErrorResponse(`No participant with the id of ${req.params.id}`), 404);
    }

    if (participant.photo) {
        const previousPhotoPath = `${process.env.FILE_UPLOAD_PATH}/${participant.photo}`;
        if (fs.existsSync(previousPhotoPath)) {
            fs.unlinkSync(previousPhotoPath);
        }
    }

    res.status(200).json({
        success: true,
        data: {}
    });
});


// @desc      Upload photo for participant
// @route     PUT /api/v1/participants/:id/photo
// @access    Private
exports.participantPhotoUpload = asyncHandler(async (req, res, next) => {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
        return next(
            new ErrorResponse(`No participant not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure participant is profile owner
    // if (participant.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this profile`, 401));
    // }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = fileUploader(req, participant._id, next);

    // Remove previous photo if exists
    if (participant.photo) {
        const previousPhotoPath = `${process.env.FILE_UPLOAD_PATH}/${participant.photo}`;
        if (fs.existsSync(previousPhotoPath)) {
            fs.unlinkSync(previousPhotoPath);
        }
    }

    file.mv(`${process.env.FILE_UPLOAD_PATH}/uploads/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Participant.findByIdAndUpdate(req.params.id, { photo: `uploads/${file.name}` });

        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});