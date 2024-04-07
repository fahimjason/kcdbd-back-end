const axios = require('axios').default;
const fs = require('fs');

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const { couponValidation } = require('../utils/coupon-validation');
const { checkTimeExpiration } = require('../utils/time');
const sendEmail = require('../utils/sendEmail');
const generateInvoice = require('../utils/invoice');
const { formatDateAsDhaka } = require('../utils/time');
const { uploadInS3, uploadToS3 } = require('../utils/s3');
const { getContentType } = require('../utils/file-upload');

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

    const { name, email, phone, track, workshop, tshirt, description, organization, designation, studentId, cartItems } = req.body;


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

    if (!order) {
        return next(
            new ErrorResponse(`No order found with the id of ${req.params.orderId}.`, 404),
        );
    }

    const { _id, name, email, phone, total } = order;

    if (order.status === 'paid') {
        return next(
            new ErrorResponse(`The order with the id of ${req.params.orderId} is already paid successfully.`, 400),
        );
    }

    if (order.status === 'failed') {
        return next(
            new ErrorResponse(`The order with the id of ${req.params.orderId} already processed.`, 400),
        );
    }

    if (total > 0) {
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
            fail_url: process.env.PAYMENT_FAIL_URL,
            cancel_url: process.env.PAYMENT_CANCEL_URL,
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

        const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="refresh" content="5;url=${process.env.REDIRECT_URL}">
        <title>Payment Response</title>
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container">
            <div class="row">
            <div class="col-md-8 offset-md-2">
                <div class="card mt-4">
                <div class="card-header bg-primary text-white">
                    <h4 class="text-center">Payment Response</h4>
                </div>
                <div class="card-body">
                    <p>Dear ${order.name},</p>
                    <p>Congratulations! Your payment for KCD Dhaka 2024 has been successfully processed. Thank you for your registration. An event confirmation order invoice has been attached to your email. Your <b>Order ID(${order._id})</b> will serve as your unique identifier. <b>Please keep this soft copy of the Order ID for reference on the event day.</b></p>
                    <p>If you have any questions or concerns regarding your payment, please feel free to contact us.</p>
                    <p>Best regards,<br>KCD Dhaka 2024 Organizing Team</p>
                </div>
                </div>
            </div>
            </div>
        </div>
        </body>
        </html>
        `;

        try {
            const orderDetails = {
                name: order.name,
                mobile: order.phone.number,
                orderId: order._id,
                date: formatDateAsDhaka(),
                items: order.orderItems,
                subtotal: order.subtotal,
                vat: order.vat || 0,
                tax: order.tax,
                discount: order.discount,
                total: order.total
            };

            const invoicePath = `${process.env.FILE_UPLOAD_PATH}/invoices`
            const invoice = `invoice_${order._id}.pdf`;

            // Generate PDF invoice
            const generatedInvoicePath = await generateInvoice(orderDetails, `${invoicePath}/${invoice}`);

            // Read the generated PDF file
            const pdfAttachment = fs.readFileSync(generatedInvoicePath);

            // Send email with attachment
            const options = {
                email: order.email,
                subject: 'KCD Payment Information',
                htmlEmail,
                invoice
            }

            await sendEmail(options, pdfAttachment);

            const contentType = getContentType(generatedInvoicePath);

            // Upload to S3
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `invoices/${invoice}`,
                Body: pdfAttachment,
                ContentType: contentType,
            };

            const s3UploadData = await uploadToS3(params, next);

            order.invoice = s3UploadData.key;
            await order.save();

            fs.unlinkSync(generatedInvoicePath);

            res.send(htmlEmail);

            // res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.log(err);

            return next(new ErrorResponse('Email could not be sent', 500));
        }
    }
});

// @desc      Update payment
// @route     POST /api/v1/orders/payment-update
// @access    Public
exports.updatePayment = asyncHandler(async (req, res, next) => {
    const status = req.body.pay_status === 'Successful' ? 'paid' : 'failed';

    const order = await Order.findById(req.body.mer_txnid);
    order.status = status;
    order.payment_info = { ...req.body };
    await order.save();

    if (status === 'paid') {
        const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="refresh" content="5;url=${process.env.REDIRECT_URL}">
        <title>Payment Response</title>
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container">
            <div class="row">
            <div class="col-md-8 offset-md-2">
                <div class="card mt-4">
                <div class="card-header bg-primary text-white">
                    <h4 class="text-center">Payment Response</h4>
                </div>
                <div class="card-body">
                    <p>Dear ${order.name},</p>
                    <p>Congratulations! Your payment for KCD Dhaka 2024 has been successfully processed. Thank you for your registration. An event confirmation order invoice has been attached to your email. Your <b>Order ID(${order._id})</b> will serve as your unique identifier. <b>Please keep this soft copy of the Order ID for reference on the event day.</b></p>
                    <p>If you have any questions or concerns regarding your payment, please feel free to contact us.</p>
                    <p>Best regards,<br>KCD Dhaka 2024 Organizing Team</p>
                </div>
                </div>
            </div>
            </div>
        </div>
        </body>
        </html>
        `;

        try {
            const orderDetails = {
                name: order.name,
                mobile: order.phone.number,
                orderId: order._id,
                date: formatDateAsDhaka(),
                items: order.orderItems,
                subtotal: order.subtotal,
                vat: order.vat || 0,
                tax: order.tax,
                discount: order.discount,
                total: order.total
            };

            const invoicePath = `${process.env.FILE_UPLOAD_PATH}/invoices`
            const invoice = `invoice_${order._id}.pdf`;

            // Generate PDF invoice
            const generatedInvoicePath = await generateInvoice(orderDetails, `${invoicePath}/${invoice}`);

            // Read the generated PDF file
            const pdfAttachment = fs.readFileSync(generatedInvoicePath);

            // Send email with attachment
            const options = {
                email: order.email,
                subject: 'KCD Payment Information',
                htmlEmail,
                invoice
            }

            await sendEmail(options, pdfAttachment);

            const contentType = getContentType(generatedInvoicePath);

            // Upload to S3
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `invoices/${invoice}`,
                Body: pdfAttachment,
                ContentType: contentType,
            };

            const s3UploadData = await uploadToS3(params, next);

            order.invoice = s3UploadData.key;
            await order.save();

            fs.unlinkSync(generatedInvoicePath);

            res.send(htmlEmail);
        } catch (err) {
            console.log(err);

            return next(new ErrorResponse('Email could not be sent', 500));
        }
    } else {
        const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="refresh" content="5;url=${process.env.REDIRECT_URL}">
        <title>Payment Response</title>
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container">
            <div class="row">
            <div class="col-md-8 offset-md-2">
                <div class="card mt-4">
                <div class="card-header bg-primary text-white">
                    <h4 class="text-center">Payment Response</h4>
                </div>
                <div class="card-body">
                    <p>Dear ${order.name},</p>
                    <p>Unfortunately! Your payment for KCD Dhaka 2024 has been failed. Thank you for your effort and time. You can try again.</p>
                    <p>If you have any questions or concerns regarding your payment, please feel free to contact us.</p>
                    <p>Best regards,<br>KCD Dhaka 2024 Organizing Team</p>
                </div>
                </div>
            </div>
            </div>
        </div>
        </body>
        </html>
        `;

        res.send(htmlEmail);
    }
});


// @desc      Order summary
// @route     POST /api/v1/orders/summary
// @access    Private/Admin
exports.orderSummary = asyncHandler(async (req, res, next) => {

    // const orders = await Order.aggregate([
    //     {
    //         $match: { status: 'paid' } // Match only the paid orders
    //     },
    //     {
    //         $lookup: {
    //             from: "tickets", // Name of the Ticket collection
    //             localField: "orderItems.ticket",
    //             foreignField: "_id",
    //             as: "ticketInfo"
    //         }
    //     },
    //     {
    //         $unwind: "$ticketInfo" // Unwind the array produced by the $lookup stage
    //     },
    //     {
    //         $group: {
    //             _id: null,
    //             numSales: { $sum: 1 }, // Count the number of sales
    //             totalSales: { $sum: '$total' }, // Sum up the total price of all paid orders
    //             totalTickets: { $sum: "$orderItems.quantity" }, // Sum up the total number of tickets sold
    //             totalTicketRevenue: {
    //                 $sum: {
    //                     $reduce: {
    //                         input: "$orderItems",
    //                         initialValue: 0,
    //                         in: {
    //                             $add: [
    //                                 "$$value",
    //                                 {
    //                                     $cond: {
    //                                         if: { $and: [{ $gt: ["$$this.price", 0] }, "$$this.price"] },
    //                                         then: { $multiply: ["$$this.price", "$$this.quantity"] },
    //                                         else: 0
    //                                     }
    //                                 }
    //                             ]
    //                         }
    //                     }
    //                 }
    //             } // Calculate total revenue from tickets
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "tickets", // Name of the Ticket collection
    //             let: { ticketId: { $ifNull: ["$orderItems.ticket", []] } },
    //             pipeline: [
    //                 {
    //                     $match: {
    //                         $expr: { $not: { $in: ["$_id", "$$ticketId"] } } // Find tickets that haven't been purchased
    //                     }
    //                 }
    //             ],
    //             as: "unsoldTickets"
    //         }
    //     },
    //     {
    //         $unwind: "$unsoldTickets" // Unwind the array produced by the $lookup stage
    //     },
    //     {
    //         $group: {
    //             _id: null,
    //             numSales: { $first: "$numSales" }, // Retain the count of sales
    //             totalSales: { $first: "$totalSales" }, // Retain the total sales amount
    //             totalTickets: { $first: "$totalTickets" }, // Retain the total number of tickets sold
    //             totalTicketRevenue: { $first: "$totalTicketRevenue" }, // Retain the total ticket revenue
    //             totalUnsoldTickets: { $sum: "$unsoldTickets.limit" } // Sum up the limit of unsold tickets
    //         }
    //     }
    // ]);

    // const orders = await Order.aggregate([
    //     {
    //         $match: { status: 'paid' } // Match only the paid orders
    //     },
    //     {
    //         $lookup: {
    //             from: "tickets", // Name of the Ticket collection
    //             localField: "orderItems.ticket",
    //             foreignField: "_id",
    //             as: "ticketInfo"
    //         }
    //     },
    //     {
    //         $unwind: "$ticketInfo" // Unwind the array produced by the $lookup stage
    //     },
    //     // {
    //     //     $group: {
    //     //         _id: null,
    //     //         numSales: { $sum: 1 }, // Count the number of sales
    //     //         totalSales: { $sum: '$total' }, // Sum up the total price of all paid orders
    //     //         totalTickets: { $sum: "$orderItems.quantity" }, // Sum up the total number of tickets sold
    //     //         totalTicketRevenue: { 
    //     //             $sum: {
    //     //                 $reduce: {
    //     //                     input: "$orderItems",
    //     //                     initialValue: 0,
    //     //                     in: {
    //     //                         $add: [
    //     //                             "$$value",
    //     //                             {
    //     //                                 $cond: {
    //     //                                     if: {
    //     //                                         $and: [
    //     //                                             { $gt: [{ $toDouble: "$$this.price" }, 0] },
    //     //                                             { $gt: [{ $toDouble: "$$this.quantity" }, 0] }
    //     //                                         ]
    //     //                                     },
    //     //                                     then: { $multiply: [{ $toDouble: "$$this.price" }, { $toDouble: "$$this.quantity" }] },
    //     //                                     else: 0
    //     //                                 }
    //     //                             }
    //     //                         ]
    //     //                     }
    //     //                 }
    //     //             }
    //     //         } // Calculate total revenue from tickets
    //     //     }
    //     // }
    // ]);

    const orders = await Order.aggregate([
        {
            $match: { status: 'paid' } // Match only the paid orders
        },
        {
            $group: {
                _id: null,
                numSales: { $sum: 1 }, // Count the number of sales
                totalSales: { $sum: '$subtotal' }, // Sum up the total price of all paid orders
                discounts: { $sum: '$discount' }
            }
        },
        {
            $addFields: {
                revenue: { $subtract: ["$totalSales", "$discounts"] } // Calculate revenue by subtracting discounts from total sales
            }
        }
    ]);

    const { _id, ...rest } = orders[0];

    res.status(200).json({
        success: true,
        data: { ...rest }
    });
});

