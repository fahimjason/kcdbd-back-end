const express = require('express');
const {
    getParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    deleteParticipant,
} = require('../controllers/participants');

const Participant = require('../models/Participant');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(advancedResults(Participant), getParticipants)
    .post(protect, authorize('admin'), createParticipant);

router
    .route('/:id')
    .get(getParticipant)
    .put(protect, authorize('admin'), updateParticipant)
    .delete(protect, authorize('admin'), deleteParticipant);

module.exports = router;