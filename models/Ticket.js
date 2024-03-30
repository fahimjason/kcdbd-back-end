const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a ticket cost']
    },
    ticketType: {
        type: String,
        enum: ['student', 'professional'],
        required: true
    },
    limit: {
        type: Number,
        required: [true, 'Please add the ticket limit number'],
    },
    bookCount: { 
        type: Number, 
        default: 0 
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please add the ticket expiry date']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);