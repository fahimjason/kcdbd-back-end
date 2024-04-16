const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    scheduleTime: {
        type: String,
    },
    title: {
        type: String,
        required: [true, 'Please add the schedule title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    scheduleTrack: {
        type: String,
        enum: ['keynote-track', 'devops-track', 'security-track', 'startup-community-hub'],
        required: [true, 'Please add a schedule track']
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

module.exports = mongoose.model('Schedule', ScheduleSchema);