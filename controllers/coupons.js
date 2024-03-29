const voucherCodes = require('voucher-code-generator');

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Coupon = require('../models/Coupon');
const { couponValidation } = require('../utils/coupon-validation');

// @desc      Get coupons
// @route     GET /api/v1/coupons
// @access    Public
exports.getCoupons = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single coupon
// @route     GET /api/v1/coupons/:id
// @access    Public
exports.getCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(
            new ErrorResponse(`No coupon with the id of ${req.params.id}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: coupon
    });
});

// @desc      Add coupon
// @route     POST /api/v1/coupons
// @access    Private
exports.addCoupon = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const coupon = await Coupon.create({
        ...req.body, 
        code: `${req.body.code}-${voucherCodes.generate({ length: 4 })[0]}`
    });

    res.status(200).json({
        success: true,
        data: coupon
    });
});

// @desc      Update coupon
// @route     PUT /api/v1/coupons/:id
// @access    Private
exports.updateCoupon = asyncHandler(async (req, res, next) => {
    let coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new ErrorResponse(`No coupon with the id of ${req.params.id}`), 404);
    }

    // Make sure user is coupon owner
    if (coupon.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update coupon ${course._id}`, 401));
    }

    ticket = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: ticket
    });
});

// @desc      Delete coupon
// @route     DELETE /api/v1/coupons/:id
// @access    Private
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(
            new ErrorResponse(`No coupon with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is coupon owner
    if (coupon.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete course ${course._id}`, 401));
    }

    await Coupon.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc      Apply coupon
// @route     GET /api/v1/coupons/apply-coupon/:coupon
// @access    Public
exports.applyCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await couponValidation(req.params.coupon, req.params.productId, next);
    const {code, discountPercentage, isAvailable} = coupon;
    
    res.status(200).json({
        success: true,
        data: {
            code,
            discountPercentage,
            isAvailable
        }
    });
});