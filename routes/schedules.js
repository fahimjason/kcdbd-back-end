const express = require('express');
const {
    getSchedules,
    getSchedule,
    addSchedule,
    updateSchedule,
    deleteSchedule
} = require('../controllers/schedules');

const Schedule = require('../models/Schedule');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(advancedResults(Schedule, {
        path: 'speakers',
        select: 'name designation organization linkedin photo'
    }), getSchedules)
    .post(protect, authorize('organizer', 'admin'), addSchedule);

router
    .route('/:id')
    .get(getSchedule)
    .put(protect, authorize('organizer', 'admin'), updateSchedule)
    .delete(protect, authorize('organizer', 'admin'), deleteSchedule);

module.exports = router;