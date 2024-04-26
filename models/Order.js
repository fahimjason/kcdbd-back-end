const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');

const orderItemSchema = mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    ticket: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        required: true,
    },
});

const OrderSchema = mongoose.Schema({
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
            minlength: 11,
            maxlength: 14,
        },
        promotion: {
            type: Boolean,
            required: [true, 'Please add your consent about the promotional information. Do you want to receive it or not?']
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
    organization:{
        type: String,
        required: true,
    },
    designation:{
        type: String,
    },
    studentId:{
        type: String,
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
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'initiated', 'failed', 'paid', 'canceled', 'refunded'],
        default: 'pending',
    },
    orderItems: [{type: orderItemSchema, _id: false}],
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
    terms: {
        type: Boolean,
        require: [true, 'Please add your consent about the terms & conditions. ']
    },
    payment_url: String,
    coupon: {
        type: mongoose.Schema.ObjectId,
        ref: 'Coupon',
    },
    invoice: {
        type: String,
    },
    // user: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'User',
    //     required: true,
    // },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to check workshop limit and user session orders
OrderSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('workshop')) {
            next();
        }

        const order = this;

        let morningCount = 0;
        let afternoonCount = 0;

        for (const workshopId of order.workshop) {
            const workshop = await this.model('Workshop').findById(workshopId);

            const ordersCount = await this.model('Order').countDocuments({ workshop: workshopId, status: { $in: ['paid', 'pending'] } });

            if (ordersCount >= workshop.limit) {
                workshop.availability = false;
                await workshop.save();
                return next(new ErrorResponse(`${workshop.title} workshop limit reached out. Please choose another one or go ahead with presentation-deck.`, 400));
            }

            // Increment counts based on session time
            if (workshop.sessionTime === 'morning') {
                morningCount++;
            } else if (workshop.sessionTime === 'afternoon') {
                afternoonCount++;
            }
        }

        // Check if user already has two active orders for morning session
        if (morningCount > 1) {
            return next(new ErrorResponse(`One can't take more than one workshop for morning session.`, 400));
        }

        // Check if user already has two active orders for afternoon session
        if (afternoonCount > 1) {
            return next(new ErrorResponse(`One can't take more than one workshop for afternoon session.`, 400));
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save hook to increase ticket limit in orders
OrderSchema.pre('save', async function(next) {
    try {

        if (!this.isModified('orderItems')) {
            next();
        }

        const order = this;
        let coupon;

        if(order.coupon) {
            coupon = await this.model('Coupon').findById(order.coupon);
        }

        for (const item of order.orderItems) {
            const ticket = await this.model('Ticket').findById(item.ticket);

            // Check ticket booking count
            if(ticket.bookCount + item.quantity > ticket.limit) {
                return next(
                    new ErrorResponse(`${ticket.title} has not enough available quantity`, 400)
                ); 
            } 

            // Check coupon using count
            if(coupon && coupon.usageCount + item.quantity > coupon.limit) {
                return next(
                    coupon && new ErrorResponse(`${coupon.code} coupon is not available`, 400)
                ); 
            } 
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save hook to remove ticket count before delete pending orders
OrderSchema.pre('remove', async function(next) {
    try{
        const order = this;
        
        if(order.status === 'pending') {
            // for (const item of order.orderItems) {
            //     const ticket = await this.model('Ticket').findById(item.ticket);
    
            //     //Remove ticket booking count
            //     ticket.bookCount = ticket.bookCount - item.quantity;
            //     await ticket.save();
            // }
        } 

        next();
    } catch (error) {
        next(error)
    }
});

module.exports = mongoose.model('Order', OrderSchema);