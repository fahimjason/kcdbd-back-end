const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');

const orderItemSchema = mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    ticket: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        required: true,
    },
});

const orderSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        number: {
            type: String,
            required: true,
            unique: true,
            minlength: 11,
            maxlength: 14,
        },
        promotion: {
            type: Boolean,
            required: true
        }
    },
    track: {
        type: String,
        enum: ['presentation-deck', 'workshop'],
        required: true
    },
    workshop: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Workshop',
        }
    ],
    description: {
        type: String,
        required: true,
    },
    address:{
        type: String,
        required: true,
    },
    tshirt: {
        type: String,
        enum: ['S', 'M', 'L', 'XL', '2XL'],
        required: true
    },
    tax: {
        type: Number,
        required: true,
        default: 0
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0
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
    payment_info: {
        pg_service_charge_bdt: String,
        amount_original: String,
        gateway_fee: String,
        pg_service_charge_usd: String,
        pg_card_bank_name: String,
        pg_card_bank_country: String,
        card_number: String,
        card_holder: String,
        status_code: String,
        pay_status: String,
        cus_name: String,
        cus_email: String,
        cus_phone: String,
        currency_merchant: String,
        convertion_rate: String,
        ip_address: String,
        other_currency: String,
        pg_txnid: String,
        epw_txnid: String,
        mer_txnid: String,
        store_id: String,
        merchant_id: String,
        currency: String,
        store_amount: String,
        pay_time: String,
        amount: String,
        bank_txn: String,
        card_type: String,
        reason: String,
        pg_card_risklevel: String,
        pg_error_code_details: String,
    },
    timing: {
        type: Date,
        default: Date.now() + 30 * 60 * 1000,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);