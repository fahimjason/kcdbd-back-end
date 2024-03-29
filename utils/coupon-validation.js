const moment = require('moment-timezone');
const Coupon = require('../models/Coupon');
const ErrorResponse = require('./errorResponse');

const couponValidation = async (code, productId, next) => {
    
    const coupon = await Coupon.findOne({code});
    const {isAvailable, products, expiryDate, usageCount, limit } = coupon;

    const currentDateTime = moment.tz(process.env.TIME_ZONE);
    const isExpired = moment.tz(expiryDate, process.env.TIME_ZONE).isBefore(currentDateTime);

    const isMatched = products.includes(productId);
    const isLimitFill =  usageCount >= limit;
    
    if(!coupon || !isAvailable || !isMatched || isLimitFill || isExpired) {
        coupon.isAvailable = false;
        await coupon.save();

        return next(
            new ErrorResponse(`${code} is an invalid coupon.`, 400)
        );
    }

    return coupon;
}

module.exports.couponValidation = couponValidation;