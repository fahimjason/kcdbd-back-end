const express = require('express');
const {
    getOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    paymentRequest,
    updatePayment,
    orderSummary,
    ordersCSV
} = require('../controllers/orders');

const Order = require('../models/Order');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
    .route('/')
    .get(protect, advancedResults(Order, 'workshop'), getOrders)
    .post(addOrder);

router
    .route('/summary')
    .get(protect, authorize('admin'), orderSummary);
    
router
    .route('/csv')
    .get(protect, authorize('admin'), ordersCSV);

router
    .route('/payment-update')
    .post(updatePayment);

router
    .route('/payment/:orderId')
    .get(paymentRequest);

router
    .route('/:id')
    .get(getOrder)
    .put(protect, authorize('admin'), updateOrder)
    .delete(protect, authorize('admin'), deleteOrder);

module.exports = router;