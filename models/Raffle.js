const mongoose = require('mongoose');

const RaffleSchema = new mongoose.Schema({
    name: String,
    email: String,
    organization: String,
    designation: String
});

module.exports = mongoose.model('Raffle', RaffleSchema);