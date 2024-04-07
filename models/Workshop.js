const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a workshop title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    limit: {
        type: Number,
        required: [true, 'Please add a limit number']
    },
    level: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    schedule: {
        type: String,
    },
    sessionTime: {
        type: String,
        required: [true, 'Please add the session time'],
        enum: ['morning', 'afternoon']
    },
    availability: {
        type: Boolean,
        default: true
    },
    speakers: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Participant',
        }
    ],
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

module.exports = mongoose.model('Workshop', WorkshopSchema);