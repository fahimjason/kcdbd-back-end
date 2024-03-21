const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    designation: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        match: [
            /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/,
            'Please add a valid URL for image url'
        ]
    },
    role: {
        type: String,
        enum: ['participant', 'sponsor', 'speaker', 'volunteer'],
        default: 'participant'
    },
    sponsorType: {
        type: String,
    },
    sponsorLogo: {
        type: String,
        match: [
            /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/,
            'Please add a valid URL for sponsor log'
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Participant', ParticipantSchema);
