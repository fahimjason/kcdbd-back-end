const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a course title'],
        unique: [true, 'Coupon should be unique'],
        trim: true,
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Please add the coupon discount percentage'],
    },
    limit: {
        type: Number,
        required: [true, 'Please add the coupon limit number'],
    },
    usageCount: {
        type: Number,
        default: 0
    },
    products: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Ticket',
        }
    ],
    description: {
        type: String,
        required: [true, 'Please add a coupon description']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please add the coupon expiry date']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    users: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Reverse populate with virtuals
CouponSchema.virtual('orders', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'coupon',
    justOne: false,
    options: { select: '_id name email subtotal discount total' }
});

module.exports = mongoose.model('Coupon', CouponSchema);