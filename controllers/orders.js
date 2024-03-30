const axios = require('axios').default;

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const { couponValidation } = require('../utils/coupon-validation');
const { checkTimeExpiration } = require('../utils/time');

// @desc      Get orders
// @route     GET /api/v1/orders
// @access    Public
exports.getOrders = asyncHandler(async (req, res, next) => {
    // if (req.user.role !== 'admin') {
    //     const orders = await Order.find({ user: req.user.id });

    //     return res.status(200).json({
    //         success: true,
    //         count: orders.length,
    //         data: orders
    //     });
    // } else {
        res.status(200).json(res.advancedResults);
    // }
});

// @desc      Get single order
// @route     GET /api/v1/orders/:id
// @access    Public
exports.getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order with the id of ${req.params.id}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc      Add order
// @route     POST /api/v1/orders
// @access    Private
exports.addOrder = asyncHandler(async (req, res, next) => {
    // req.body.user = req.user.id;

    const {name, email, phone, track, workshop, tshirt, description, organization, designation, studentId, cartItems } = req.body;


    if (!cartItems || cartItems.length < 1) {
        return next(
            new ErrorResponse(`No cart items provided`, 400)
        );
    }

    let orderItems = [];
    let subtotal = 0;
    let discount = 0;
    let coupon;
    let couponId;

    for (const item of cartItems) {
            const ticket = await Ticket.findById(item.ticket);

            if (!ticket) {
                return next(
                    new ErrorResponse(`No ticket found with the id of ${item.ticket}`, 404)
                );
            }

            const { isAvailable, limit, bookCount, expiryDate, title, price, _id } = ticket;
            const isTicketExpired = checkTimeExpiration(expiryDate);
            const hasLimit = bookCount < limit; 

            if (!isAvailable || isTicketExpired || !hasLimit) {
                ticket.isAvailable = false;
                await ticket.save();

                return next(
                    new ErrorResponse(`${ticket.title} is not available`, 400)
                );
            }

    
            if (Object.keys(req.query).length) {
                coupon = await couponValidation(req.query.coupon, _id, next);
                const discountPercentage = coupon?.discountPercentage / 100 || 0;
                discount += price * discountPercentage * item.quantity || 0;
                couponId = coupon?._id;
            } 
    
            const singleOrderItem = {
                title,
                quantity: item.quantity,
                price,
                discountPercentage: coupon?.discountPercentage,
                ticket: _id,
            };
    
            // add item to order
            orderItems = [...orderItems, singleOrderItem];

            // calculate subtotal
            subtotal += item.quantity * price;
    }

    // calculate total
    const tax = req.body.tax || 0;
    const shippingFee = req.body.shippingFee || 0;
    const total = tax + shippingFee + subtotal - discount;

    const order = await Order.create({
        name,
        email, 
        phone,
        track,
        workshop, 
        tshirt,
        description,
        organization,
        designation,
        studentId,
        tax,
        shippingFee,
        subtotal,
        discount,
        total,
        orderItems,
        coupon: couponId,
        // user: req.user.id,
    });

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc      Update order
// @route     PUT /api/v1/orders/:id
// @access    Private
exports.updateOrder = asyncHandler(async (req, res, next) => {
    let order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`No order with the id of ${req.params.id}`), 404);
    }

    // Make sure user is order owner
    // if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(new ErrorResponse(`User ${req.user.id} is not authorized to update order ${course._id}`, 401));
    // }

    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc      Delete order
// @route     DELETE /api/v1/orders/:id
// @access    Private
exports.deleteOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order with the id of ${req.params.id}`, 404),
        );
    }

    // Make sure user is order owner
    // if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete order ${course._id}`, 401));
    // }

    await order.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc      Payment
// @route     GET /api/v1/orders/payment/:orderId
// @access    Public
exports.paymentRequest = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.orderId);

    if(!order) {
        return next(
            new ErrorResponse(`No order found with the id of ${req.params.orderId}.`, 404),
        );
    }

    const {_id, name, email, phone, total } = order;

    if(order.status === 'paid') {
        return next(
            new ErrorResponse(`The order with the id of ${req.params.orderId} is already paid successfully.`, 400),
        );
    }
    if(order.status === 'paid') {
        return next(
            new ErrorResponse(`The order with the id of ${req.params.orderId} is already paid successfully.`, 400),
        );
    }

    if(total > 0) {
        const paymentData = {
            cus_name: name,
            cus_email: email,
            cus_phone: phone.number,
            amount: total,
            tran_id: _id.toString(),
            signature_key: process.env.PAYMENT_SIGNATURE_KEY,
            store_id: process.env.PAYMENT_STORE_ID,
            currency: process.env.PAYMENT_CURRENCY,
            desc: 'KCD Payment',
            success_url: process.env.PAYMENT_SUCCESS_URL,
            fail_url: process.env.PAYMENT_SUCCESS_URL,
            cancel_url: process.env.PAYMENT_SUCCESS_URL,
            type: process.env.PAYMENT_DATA_TYPE
        }
    
        const payment = await axios.post(process.env.PAYMENT_API, paymentData);
    
        res.status(200).json({
            success: true,
            data: {
                payment_url: payment.data.payment_url
            }
        });
    } else {
        order.status = 'paid';
        await order.save();

        res.status(200).send(`
            Dear ${order.name},

            Congratulations! Your payment for KCD Dhaka 2024 has been successfully processed. Thank you for your registration. An event confirmation has been sent to your email address.
            
            Best regards,
            KCD Dhaka 2024 Organizing Team
        `);
    }
});

// @desc      Update payment
// @route     POST /api/v1/orders/payment-update
// @access    Public
exports.updatePayment = asyncHandler(async (req, res, next) => {
    const status = req.body.pay_status === 'Successful'  ? 'paid' : 'failed';

    const order = await Order.findById(req.body.mer_txnid);
    order.status = status;
    order.payment_info = {...req.body};
    await order.save();

    if(status === 'paid') {
        res.status(200).send(`
            Dear ${order.name},

            Congratulations! Your payment for KCD Dhaka 2024 has been successfully processed. Thank you for your registration. An event confirmation has been sent to your email address.
            
            Best regards,
            KCD Dhaka 2024 Organizing Team
        `);
    } else {
        res.send('Order Failed, please try again');
    }
});