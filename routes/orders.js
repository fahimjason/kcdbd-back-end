const express = require('express');
const {
    getOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    paymentRequest,
    updatePayment
} = require('../controllers/orders');

const Order = require('../models/Order');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
    .route('/')
    .get(advancedResults(Order, {
            path: 'user',
            select: 'name email'
        }), getOrders)
    .post(protect, addOrder);

router
    .route('/payment-update')
    .post(updatePayment);

router
    .route('/payment/:orderId')
    .get(protect, paymentRequest);

router
    .route('/:id')
    .get(getOrder)
    .put(protect, updateOrder)
    .delete(protect, authorize('admin'), deleteOrder);

module.exports = router;