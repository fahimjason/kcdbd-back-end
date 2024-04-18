const express = require('express');
const {
    applyCoupon,
    getCoupons,
    getCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controllers/coupons');

const Coupon = require('../models/Coupon');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const { path } = require('pdfkit');

const router = express.Router({ mergeParams: true });

router
    .route('/apply/:coupon/:productId')
    .get(applyCoupon)

router.use(protect);
router.use(authorize('organizer', 'admin'));

router
    .route('/')
    .get(advancedResults(Coupon, [
        {
            path: 'products',
            select: '_id, title'
        },
        'orders'
    ]), getCoupons)
    .post(addCoupon);

router
    .route('/:id')
    .get(getCoupon)
    .put(updateCoupon)
    .delete(deleteCoupon);

module.exports = router;