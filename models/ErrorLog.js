const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
    timestamp_utc: { type: Date, required: true },
    timestamp_dhaka: { type: String, required: true },
    error_message: { type: String, required: true }
});

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);