const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ErrorResponse = require('../utils/errorResponse');

const UserSchema = new mongoose.Schema({
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
    mobile: {
        type: String, 
        trim: true,
        required: [true, 'Please provide a valid mobile number'], 
        unique: true,
        minlength: 11,
        maxlength: 14,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Please select the gender']
    },
    designation: {
        type: String,
        required: [true, 'Please add your designation']
    },
    organization: {
        type: String,
        required: [true, 'Please add your organization or university name']
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
    track: {
        type: String,
        enum: ['presentation-deck', 'workshop'],
        required: true
    },
    workshop: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workshop',
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'speaker', 'volunteer'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Pre-save hook to check registration limit before adding a user
UserSchema.pre('save', async function (next) {
    try {
        // Get the workshop ID from the user's data
        const workshopId = this.workshop;

        // Count the number of users registered for the workshop
        const registrationCount = await this.model('User').countDocuments({ workshop: workshopId });

        // Find the workshop by ID to get its limit
        const workshop = await this.model('Workshop').findById(workshopId);

        // Check if the registration count exceeds the limit
        if (registrationCount >= workshop?.limit) {
            workshop.availability = false;
            await workshop.save();

            return next(
                new ErrorResponse(
                    `Registration limit for this workshop has been reached. Please select different one`,
                    400
                )
            );
        }

        next(); // Proceed to save the user if the limit check passes
    } catch (error) {
        next(error); // Pass any error to the next middleware or error handler
    }
});

// Post-remove hook to update registration count after deleting a user
UserSchema.pre('remove', async function (next) {
    try {
        // Get the workshop ID from the deleted user's data
        const workshopId = this.workshop;

        // Count the number of users registered for the workshop after deletion
        // const registrationCount = await this.model('User').countDocuments({ workshop: workshopId });

        // Find the workshop by ID and update its registration count
        await this.model('Workshop').findByIdAndUpdate(workshopId, { availability: true });

        next(); // Proceed to the next middleware or operation
    } catch (error) {
        next(error); // Pass any error to the next middleware or error handler
    }
});

module.exports = mongoose.model('User', UserSchema);
