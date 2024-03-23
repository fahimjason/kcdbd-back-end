const express = require('express');
const {
    getWorkshops,
    getWorkshop,
    addWorkshop,
    updateWorkshop,
    deleteWorkshop
} = require('../controllers/workshops');

const Workshop = require('../models/Workshop');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(
        advancedResults(Workshop), getWorkshops)
    .post(protect, authorize('organizer', 'admin'), addWorkshop);

router
    .route('/:id')
    .get(getWorkshop)
    .put(protect, authorize('organizer', 'admin'), updateWorkshop)
    .delete(protect, authorize('organizer', 'admin'), deleteWorkshop);

module.exports = router;