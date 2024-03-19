const express = require('express');
const {
    getTickets,
    getTicket,
    addTicket,
    updateTicket,
    deleteTicket
} = require('../controllers/tickets');

const Ticket = require('../models/Ticket');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(
        advancedResults(Ticket),getTickets)
    .post(protect, authorize('organizer', 'admin'), addTicket);

router
    .route('/:id')
    .get(getTicket)
    .put(protect, authorize('organizer', 'admin'), updateTicket)
    .delete(protect, authorize('organizer', 'admin'), deleteTicket);

module.exports = router;