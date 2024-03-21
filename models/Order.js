const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    ticket: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        required: true,
    },
});

const orderSchema = mongoose.Schema({
    tax: {
        type: Number,
        required: true,
    },
    shippingFee: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'failed', 'paid', 'canceled', 'refunded'],
        default: 'pending',
    },
    orderItems: [orderItemSchema],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
});

module.exports = mongoose.model('Order', orderSchema);