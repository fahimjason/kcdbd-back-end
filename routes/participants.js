const express = require('express');
const {
    getParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    participantPhotoUpload
} = require('../controllers/participants');

const Participant = require('../models/Participant');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(advancedResults(Participant), getParticipants)
    .post(protect, authorize('admin', 'organizer'), createParticipant);

router.route('/:id/photo')
    .put(protect, authorize('admin', 'organizer'), participantPhotoUpload);

router
    .route('/:id')
    .get(getParticipant)
    .put(protect, authorize('admin', 'organizer'), updateParticipant)
    .delete(protect, authorize('admin', 'organizer'), deleteParticipant);

module.exports = router;