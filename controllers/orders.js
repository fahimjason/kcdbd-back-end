const axios = require('axios').default;

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc      Get orders
// @route     GET /api/v1/orders
// @access    Public
exports.getOrders = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
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
    req.body.user = req.user.id;

    const {name, email, phone, track, workshop, tshirt, description, address, cartItems } = req.body;

    if (!cartItems || cartItems.length < 1) {
        return next(
            new ErrorResponse(`No cart items provided`, 400)
        );
    }

    let orderItems = [];
    let subtotal = 0;

    for (const item of cartItems) {
            const dbTicket = await Ticket.findById(item.ticket);

            if (!dbTicket) {
                return next(
                    new ErrorResponse(`No ticket found with the id of ${item.ticket}`, 404)
                );
            }
    
            const { title, price, _id } = dbTicket;
    
            const singleOrderItem = {
                quantity: item.quantity,
                title: title,
                price,
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
    const total = tax + shippingFee + subtotal;

    const order = await Order.create({
        name,
        email, 
        phone,
        track,
        workshop, 
        tshirt,
        description,
        address,
        tax,
        shippingFee,
        subtotal,
        total,
        orderItems,
        user: req.user.id,
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
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update order ${course._id}`, 401));
    }

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
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete order ${course._id}`, 401));
    }

    await order.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

exports.paymentRequest = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.orderId);

    if(order.status === 'paid') {
        return next(
            new ErrorResponse(`The order with the id of ${req.params.orderId} is already paid successfully.`, 400),
        );
    }
    const user = await User.findById(req.user);

    const paymentData = {
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: "01715901532",
        amount: order.total,
        tran_id: order._id.toString(),
        signature_key: process.env.PAYMENT_SIGNATURE_KEY,
        store_id: process.env.PAYMENT_STORE_ID,
        currency: 'BDT',
        desc: 'KCD Payment',
        cus_add1: "53, Gausul Azam Road, Sector-14, Dhaka, Bangladesh",
        // cus_add2: "Dhaka",
        // cus_city: "Dhaka",
        // cus_country: "Bangladesh",
        success_url: process.env.PAYMENT_SUCCESS_URL,
        fail_url: process.env.PAYMENT_SUCCESS_URL,
        cancel_url: process.env.PAYMENT_SUCCESS_URL,
        type: 'json'
    }

    const payment = await axios.post(process.env.PAYMENT_API, paymentData);

    res.status(200).json({
        success: true,
        data: {
            payment_url: payment.data.payment_url
        }
    });
});

exports.updatePayment = asyncHandler(async (req, res, next) => {
    res.send('Paid');
    const order = await Order.findById(req.body.mer_txnid);
    order.status = req.body.pay_status === 'Successful'  ? 'paid' : 'failed';
    order.payment_info = {...req.body};
    await order.save();

});