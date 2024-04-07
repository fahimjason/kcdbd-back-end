const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    designation: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    linkedin: {
        type: String,
        match: [
            /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/,
            'Please add a valid URL for LinkedIn profile'
        ]
    },
    photo: {
        type: String,
        // match: [
        //     /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/,
        //     'Please add a valid URL for image url'
        // ]
    },
    role: {
        type: String,
        enum: ['organizer', 'sponsor', 'speaker', 'key-note-speaker', 'event-speaker', 'volunteer'],
        required: true
    },
    speaking_topic: String,
    sponsor_status: {
        type: String,
        enum: ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', ''],
    },
    sponsor_link: String,
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Participant', ParticipantSchema);
